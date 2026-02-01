import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Attendance, AttendanceStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(attendance: Attendance) {
    return {
      id: attendance.id,
      userId: attendance.userId,
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      status: attendance.status,
      note: attendance.note,
    };
  }

  private ensureCheckOutAfterCheckIn(checkIn?: string, checkOut?: string) {
    if (!checkIn || !checkOut) return;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (outDate <= inDate) {
      throw new BadRequestException('checkOut must be after checkIn.');
    }
  }

  async create(dto: CreateAttendanceDto) {
    this.ensureCheckOutAfterCheckIn(dto.checkIn, dto.checkOut);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        userId: dto.userId,
        date: new Date(dto.date),
      },
    });
    if (existing) {
      throw new ConflictException('Attendance already exists for this date.');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        userId: dto.userId,
        date: new Date(dto.date),
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        status: dto.status ?? AttendanceStatus.PRESENT,
        note: dto.note ?? null,
      },
    });

    return this.toResponse(attendance);
  }

  async list(query: QueryAttendanceDto, requester: { id: string; role: Role }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (requester.role === Role.EMPLOYEE && query.userId && query.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own attendance.');
    }

    const where: any = {
      userId: query.userId,
      status: query.status,
      date: {
        gte: query.fromDate ? new Date(query.fromDate) : undefined,
        lte: query.toDate ? new Date(query.toDate) : undefined,
      },
    };

    if (requester.role === Role.EMPLOYEE) {
      where.userId = requester.id;
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: data.map((item) => this.toResponse(item)),
      meta: { page, limit, total },
    };
  }

  async getById(id: string, requester: { id: string; role: Role }) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Attendance not found.');
    }
    if (requester.role === Role.EMPLOYEE && attendance.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own attendance.');
    }
    return this.toResponse(attendance);
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    this.ensureCheckOutAfterCheckIn(dto.checkIn, dto.checkOut);
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Attendance not found.');
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        status: dto.status ?? undefined,
        note: dto.note ?? undefined,
      },
    });

    return this.toResponse(updated);
  }
}
