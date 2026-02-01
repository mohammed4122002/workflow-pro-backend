import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { QueryFinancialRecordsDto } from './dto/query-financial-records.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | null) {
    if (value === null) return 0;
    return typeof value === 'number' ? value : Number(value);
  }

  private toResponse(record: {
    id: string;
    userId: string;
    month: string;
    salaryPaid: Prisma.Decimal | number;
    bonuses: Prisma.Decimal | number;
    deductions: Prisma.Decimal | number;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      userId: record.userId,
      month: record.month,
      salaryPaid: this.toNumber(record.salaryPaid),
      bonuses: this.toNumber(record.bonuses),
      deductions: this.toNumber(record.deductions),
      notes: record.notes,
      createdAt: record.createdAt,
    };
  }

  private async ensureUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.isActive) {
      throw new BadRequestException('User is inactive.');
    }
  }

  async create(dto: CreateFinancialRecordDto) {
    await this.ensureUserActive(dto.userId);

    const existing = await this.prisma.financialRecord.findFirst({
      where: { userId: dto.userId, month: dto.month },
    });
    if (existing) {
      throw new ConflictException('Financial record already exists for this month.');
    }

    const record = await this.prisma.financialRecord.create({
      data: {
        userId: dto.userId,
        month: dto.month,
        salaryPaid: new Prisma.Decimal(dto.salaryPaid),
        bonuses: new Prisma.Decimal(dto.bonuses ?? 0),
        deductions: new Prisma.Decimal(dto.deductions ?? 0),
        notes: dto.notes ?? null,
      },
    });

    return this.toResponse(record);
  }

  async list(query: QueryFinancialRecordsDto, requester: { id: string; role: Role }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (requester.role === Role.EMPLOYEE && query.userId && query.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own records.');
    }

    const where: Prisma.FinancialRecordWhereInput = {
      userId: query.userId,
      month: query.month ?? undefined,
      AND: [
        query.fromMonth ? { month: { gte: query.fromMonth } } : undefined,
        query.toMonth ? { month: { lte: query.toMonth } } : undefined,
      ].filter(Boolean) as Prisma.FinancialRecordWhereInput[],
    };

    if (requester.role === Role.EMPLOYEE) {
      where.userId = requester.id;
    }

    if (query.search && requester.role !== Role.EMPLOYEE) {
      where.user = {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { fullName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return {
      data: data.map((record) => this.toResponse(record)),
      meta: { page, limit, total },
    };
  }

  async listMine(query: QueryFinancialRecordsDto, requester: { id: string }) {
    return this.list({ ...query, userId: requester.id }, { id: requester.id, role: Role.EMPLOYEE });
  }

  async getById(id: string, requester: { id: string; role: Role }) {
    const record = await this.prisma.financialRecord.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Financial record not found.');
    }
    if (requester.role === Role.EMPLOYEE && record.userId !== requester.id) {
      throw new ForbiddenException('Employees can only access their own records.');
    }
    return this.toResponse(record);
  }

  async update(
    id: string,
    dto: UpdateFinancialRecordDto,
    requester: { id: string },
  ) {
    const record = await this.prisma.financialRecord.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Financial record not found.');
    }

    if (dto.month && dto.month !== record.month) {
      const exists = await this.prisma.financialRecord.findFirst({
        where: { userId: record.userId, month: dto.month },
      });
      if (exists) {
        throw new ConflictException('Financial record already exists for this month.');
      }
    }

    const updated = await this.prisma.financialRecord.update({
      where: { id },
      data: {
        month: dto.month ?? undefined,
        salaryPaid: dto.salaryPaid !== undefined ? new Prisma.Decimal(dto.salaryPaid) : undefined,
        bonuses: dto.bonuses !== undefined ? new Prisma.Decimal(dto.bonuses) : undefined,
        deductions: dto.deductions !== undefined ? new Prisma.Decimal(dto.deductions) : undefined,
        notes: dto.notes ?? undefined,
      },
    });

    return this.toResponse(updated);
  }

  async summary(query: { fromMonth?: string; toMonth?: string }) {
    const where: Prisma.FinancialRecordWhereInput = {
      AND: [
        query.fromMonth ? { month: { gte: query.fromMonth } } : undefined,
        query.toMonth ? { month: { lte: query.toMonth } } : undefined,
      ].filter(Boolean) as Prisma.FinancialRecordWhereInput[],
    };

    const grouped = await this.prisma.financialRecord.groupBy({
      by: ['month'],
      where,
      _sum: {
        salaryPaid: true,
        bonuses: true,
        deductions: true,
      },
      _count: {
        userId: true,
      },
      orderBy: { month: 'desc' },
    });

    return grouped.map((row) => ({
      month: row.month,
      totalSalaryPaid: this.toNumber(row._sum.salaryPaid ?? 0),
      totalBonuses: this.toNumber(row._sum.bonuses ?? 0),
      totalDeductions: this.toNumber(row._sum.deductions ?? 0),
      countEmployees: row._count.userId,
    }));
  }
}
