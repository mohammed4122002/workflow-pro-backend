import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Task, TaskComment, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdById: task.createdById,
      assignedToId: task.assignedToId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private toCommentResponse(comment: TaskComment) {
    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  private ensureFutureDate(dateString?: string) {
    if (!dateString) return;
    const due = new Date(dateString);
    const now = new Date();
    if (Number.isNaN(due.getTime()) || due <= now) {
      throw new BadRequestException('Due date must be in the future.');
    }
  }

  private ensureStatusTransition(current: TaskStatus, next: TaskStatus) {
    if (current === next) return;
    if (next === TaskStatus.BLOCKED) return;
    const allowed =
      (current === TaskStatus.TODO && next === TaskStatus.IN_PROGRESS) ||
      (current === TaskStatus.IN_PROGRESS && next === TaskStatus.DONE);
    if (!allowed) {
      throw new ConflictException('Invalid task status transition.');
    }
  }

  private async ensureAssignedUserActive(assignedToId?: string) {
    if (!assignedToId) return;
    const user = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });
    if (!user) {
      throw new NotFoundException('Assigned user not found.');
    }
    if (!user.isActive) {
      throw new BadRequestException('Assigned user is inactive.');
    }
  }

  private async getTaskOrThrow(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return task;
  }

  private ensureTaskAccess(task: Task, requester: { id: string; role: Role }) {
    if (requester.role === Role.EMPLOYEE && task.assignedToId !== requester.id) {
      throw new ForbiddenException('Employees can only access their assigned tasks.');
    }
  }

  async create(dto: CreateTaskDto, requester: { id: string }) {
    this.ensureFutureDate(dto.dueDate);
    await this.ensureAssignedUserActive(dto.assignedToId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: requester.id,
        assignedToId: dto.assignedToId ?? null,
        status: TaskStatus.TODO,
      },
    });

    return this.toResponse(task);
  }

  async list(query: QueryTasksDto, requester: { id: string; role: Role }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: query.status,
      priority: query.priority,
      assignedToId: query.assignedToId,
      OR: query.search
        ? [{ title: { contains: query.search, mode: 'insensitive' as const } }]
        : undefined,
    };

    if (requester.role === Role.EMPLOYEE) {
      where.assignedToId = requester.id;
    }

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: data.map((task) => this.toResponse(task)),
      meta: { page, limit, total },
    };
  }

  async getById(id: string, requester: { id: string; role: Role }) {
    const task = await this.getTaskOrThrow(id);
    this.ensureTaskAccess(task, requester);
    return this.toResponse(task);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    requester: { id: string; role: Role },
  ) {
    const task = await this.getTaskOrThrow(id);
    this.ensureTaskAccess(task, requester);

    const isEmployee = requester.role === Role.EMPLOYEE;
    if (isEmployee) {
      const restricted =
        dto.title !== undefined ||
        dto.description !== undefined ||
        dto.priority !== undefined ||
        dto.dueDate !== undefined ||
        dto.assignedToId !== undefined;
      if (restricted) {
        throw new ForbiddenException('Employees can only update task status.');
      }
    }

    if (dto.dueDate) {
      this.ensureFutureDate(dto.dueDate);
    }

    if (dto.assignedToId !== undefined) {
      await this.ensureAssignedUserActive(dto.assignedToId);
    }

    if (dto.status) {
      this.ensureStatusTransition(task.status, dto.status);
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        priority: dto.priority ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedToId: dto.assignedToId ?? undefined,
        status: dto.status ?? undefined,
      },
    });

    return this.toResponse(updated);
  }

  async addComment(
    id: string,
    dto: AddCommentDto,
    requester: { id: string; role: Role },
  ) {
    const task = await this.getTaskOrThrow(id);
    this.ensureTaskAccess(task, requester);

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: requester.id,
        content: dto.content,
      },
    });

    return this.toCommentResponse(comment);
  }

  async listComments(id: string, requester: { id: string; role: Role }) {
    const task = await this.getTaskOrThrow(id);
    this.ensureTaskAccess(task, requester);

    const comments = await this.prisma.taskComment.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => this.toCommentResponse(comment));
  }
}
