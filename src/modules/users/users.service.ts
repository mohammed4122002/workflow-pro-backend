import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role,
        department: dto.department ?? null,
        isActive: true,
        mustChangePassword: true,
      },
    });

    return this.toResponse(user);
  }

  async list(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      role: query.role,
      department: query.department,
      isActive: query.isActive,
      OR: query.search
        ? [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { fullName: { contains: query.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => this.toResponse(user)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getById(requestingUser: { id: string; role: Role }, id: string) {
    if (requestingUser.role === Role.EMPLOYEE && requestingUser.id !== id) {
      throw new ForbiddenException('Employees can only access their own profile.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toResponse(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (requestingUserId === id && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName ?? undefined,
        department: dto.department ?? undefined,
        role: dto.role ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });

    return this.toResponse(updated);
  }

  async deactivate(id: string, requestingUserId: string) {
    if (requestingUserId === id) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toResponse(updated);
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return this.toResponse(updated);
  }
}
