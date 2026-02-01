import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveRequest, LeaveStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { DecideLeaveDto } from './dto/decide-leave.dto';
import { QueryLeavesDto } from './dto/query-leaves.dto';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(leave: LeaveRequest) {
    return {
      id: leave.id,
      userId: leave.userId,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      type: leave.type,
      reason: leave.reason,
      status: leave.status,
      decidedById: leave.decidedById,
      decidedAt: leave.decidedAt,
    };
  }

  private ensureValidDateRange(fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      throw new BadRequestException('toDate must be after or equal to fromDate.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (from < today) {
      throw new BadRequestException('fromDate must be today or in the future.');
    }
  }

  async create(dto: CreateLeaveDto, requester: { id: string }) {
    this.ensureValidDateRange(dto.fromDate, dto.toDate);

    const leave = await this.prisma.leaveRequest.create({
      data: {
        userId: requester.id,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        type: dto.type,
        reason: dto.reason ?? null,
        status: LeaveStatus.PENDING,
      },
    });

    return this.toResponse(leave);
  }

  async list(query: QueryLeavesDto, requester: { id: string; role: Role }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (requester.role === Role.EMPLOYEE && query.userId && query.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own leaves.');
    }

    const where: any = {
      status: query.status,
      type: query.type,
      userId: query.userId,
      fromDate: {
        gte: query.fromDate ? new Date(query.fromDate) : undefined,
      },
      toDate: {
        lte: query.toDate ? new Date(query.toDate) : undefined,
      },
    };

    if (requester.role === Role.EMPLOYEE) {
      where.userId = requester.id;
    }

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fromDate: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: data.map((item) => this.toResponse(item)),
      meta: { page, limit, total },
    };
  }

  async getById(id: string, requester: { id: string; role: Role }) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      throw new NotFoundException('Leave request not found.');
    }
    if (requester.role === Role.EMPLOYEE && leave.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own leaves.');
    }
    return this.toResponse(leave);
  }

  async decide(id: string, dto: DecideLeaveDto, requester: { id: string }) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      throw new NotFoundException('Leave request not found.');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException('Leave request already decided.');
    }

    const note = dto.note ? `[DECISION NOTE] ${dto.note}` : null;
    const updatedReason = note
      ? leave.reason
        ? `${leave.reason} ${note}`
        : note
      : leave.reason;

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.decision,
        decidedById: requester.id,
        decidedAt: new Date(),
        reason: updatedReason,
      },
    });

    return this.toResponse(updated);
  }
}
