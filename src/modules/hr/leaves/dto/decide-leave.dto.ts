import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class DecideLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum(LeaveStatus)
  decision!: LeaveStatus;

  @ApiProperty({ example: 'Approved for annual leave', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
