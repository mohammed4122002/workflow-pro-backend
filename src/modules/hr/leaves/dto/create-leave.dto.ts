import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeaveDto {
  @ApiProperty({ example: '2026-02-10' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ example: '2026-02-12' })
  @IsDateString()
  toDate!: string;

  @ApiProperty({ enum: LeaveType, example: LeaveType.ANNUAL })
  @IsEnum(LeaveType)
  type!: LeaveType;

  @ApiProperty({ example: 'Family matters', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
