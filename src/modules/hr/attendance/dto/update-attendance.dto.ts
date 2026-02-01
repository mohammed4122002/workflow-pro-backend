import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-02-01T08:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-02-01T16:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Left early' })
  @IsOptional()
  @IsString()
  note?: string;
}
