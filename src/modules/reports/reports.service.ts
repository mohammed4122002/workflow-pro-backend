import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(snapshot: {
    id: string;
    type: ReportType;
    rangeFrom: Date | null;
    rangeTo: Date | null;
    data: Prisma.JsonValue;
    createdAt: Date;
  }) {
    return {
      id: snapshot.id,
      type: snapshot.type,
      rangeFrom: snapshot.rangeFrom,
      rangeTo: snapshot.rangeTo,
      data: snapshot.data as Record<string, unknown>,
      createdAt: snapshot.createdAt,
    };
  }

  private validateRange(rangeFrom?: string, rangeTo?: string) {
    if (!rangeFrom && !rangeTo) return;
    if (!rangeFrom || !rangeTo) {
      throw new BadRequestException('Both rangeFrom and rangeTo are required.');
    }
    const from = new Date(rangeFrom);
    const to = new Date(rangeTo);
    if (to < from) {
      throw new BadRequestException('rangeTo must be after or equal to rangeFrom.');
    }
  }

  private getMonthString(date: Date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private buildDateRange(rangeFrom?: string, rangeTo?: string) {
    if (!rangeFrom || !rangeTo) return undefined;
    return { gte: new Date(rangeFrom), lte: new Date(rangeTo) };
  }

  async generate(dto: GenerateReportDto) {
    this.validateRange(dto.rangeFrom, dto.rangeTo);

    const range = this.buildDateRange(dto.rangeFrom, dto.rangeTo);
    let data: Prisma.InputJsonValue = {};

    if (dto.type === ReportType.HR_SUMMARY) {
      const totalEmployees = await this.prisma.user.count({ where: { isActive: true } });

      const attendanceWhere: Prisma.AttendanceWhereInput = range
        ? { date: range }
        : {};
      const attendanceByStatus = await this.prisma.attendance.groupBy({
        by: ['status'],
        where: attendanceWhere,
        _count: { _all: true },
      });
      const totalAttendance = attendanceByStatus.reduce((sum, row) => sum + row._count._all, 0);
      const presentCount =
        attendanceByStatus.find((row) => row.status === 'PRESENT')?._count._all ?? 0;
      const lateCount =
        attendanceByStatus.find((row) => row.status === 'LATE')?._count._all ?? 0;
      const absentCount =
        attendanceByStatus.find((row) => row.status === 'ABSENT')?._count._all ?? 0;
      const attendanceRate = totalAttendance === 0 ? 0 : Number((presentCount / totalAttendance) * 100);

      const leaveWhere: Prisma.LeaveRequestWhereInput = range
        ? { fromDate: { gte: range.gte }, toDate: { lte: range.lte } }
        : {};
      const leaveByStatus = await this.prisma.leaveRequest.groupBy({
        by: ['status'],
        where: leaveWhere,
        _count: { _all: true },
      });

      data = {
        totalEmployees,
        attendanceRate,
        lateCount,
        absentCount,
        leaveRequests: {
          pending:
            leaveByStatus.find((row) => row.status === 'PENDING')?._count._all ?? 0,
          approved:
            leaveByStatus.find((row) => row.status === 'APPROVED')?._count._all ?? 0,
          rejected:
            leaveByStatus.find((row) => row.status === 'REJECTED')?._count._all ?? 0,
        },
      };
    }

    if (dto.type === ReportType.TASK_SUMMARY) {
      const taskWhere: Prisma.TaskWhereInput = range ? { createdAt: range } : {};
      const totalTasks = await this.prisma.task.count({ where: taskWhere });
      const byStatus = await this.prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { _all: true },
      });

      const now = new Date();
      const overdueTasks = await this.prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
        },
      });

      const doneTasks = await this.prisma.task.findMany({
        where: { ...taskWhere, status: TaskStatus.DONE },
        select: { createdAt: true, updatedAt: true },
      });
      const avgCompletionMs =
        doneTasks.length === 0
          ? 0
          : doneTasks.reduce((sum, task) => sum + (task.updatedAt.getTime() - task.createdAt.getTime()), 0) /
            doneTasks.length;
      const averageCompletionTimeHours = Number((avgCompletionMs / (1000 * 60 * 60)).toFixed(2));

      data = {
        totalTasks,
        tasksByStatus: {
          TODO: byStatus.find((row) => row.status === 'TODO')?._count._all ?? 0,
          IN_PROGRESS: byStatus.find((row) => row.status === 'IN_PROGRESS')?._count._all ?? 0,
          DONE: byStatus.find((row) => row.status === 'DONE')?._count._all ?? 0,
          BLOCKED: byStatus.find((row) => row.status === 'BLOCKED')?._count._all ?? 0,
        },
        overdueTasks,
        averageCompletionTimeHours,
      };
    }

    if (dto.type === ReportType.FIN_SUMMARY) {
      const monthRange =
        dto.rangeFrom && dto.rangeTo
          ? {
              gte: this.getMonthString(new Date(dto.rangeFrom)),
              lte: this.getMonthString(new Date(dto.rangeTo)),
            }
          : undefined;

      const where: Prisma.FinancialRecordWhereInput = monthRange
        ? { month: monthRange }
        : {};

      const aggregate = await this.prisma.financialRecord.aggregate({
        where,
        _sum: {
          salaryPaid: true,
          bonuses: true,
          deductions: true,
        },
        _avg: {
          salaryPaid: true,
        },
      });

      const totalSalaryPaid = Number(aggregate._sum.salaryPaid ?? 0);
      const totalBonuses = Number(aggregate._sum.bonuses ?? 0);
      const totalDeductions = Number(aggregate._sum.deductions ?? 0);
      const netPayroll = totalSalaryPaid + totalBonuses - totalDeductions;
      const averageSalary = Number(aggregate._avg.salaryPaid ?? 0);

      data = {
        totalSalaryPaid,
        totalBonuses,
        totalDeductions,
        netPayroll,
        averageSalary,
      };
    }

    const snapshot = await this.prisma.reportSnapshot.create({
      data: {
        type: dto.type,
        rangeFrom: dto.rangeFrom ? new Date(dto.rangeFrom) : null,
        rangeTo: dto.rangeTo ? new Date(dto.rangeTo) : null,
        data: data as Prisma.InputJsonValue,
      },
    });

    return this.toResponse(snapshot);
  }

  async list(query: QueryReportsDto) {
    this.validateRange(query.fromDate, query.toDate);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportSnapshotWhereInput = {
      type: query.type,
      createdAt: this.buildDateRange(query.fromDate, query.toDate),
    };

    const [data, total] = await Promise.all([
      this.prisma.reportSnapshot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reportSnapshot.count({ where }),
    ]);

    return {
      data: data.map((item) => this.toResponse(item)),
      meta: { page, limit, total },
    };
  }

  async getById(id: string) {
    const snapshot = await this.prisma.reportSnapshot.findUnique({ where: { id } });
    if (!snapshot) {
      throw new NotFoundException('Report not found.');
    }
    return this.toResponse(snapshot);
  }
}
