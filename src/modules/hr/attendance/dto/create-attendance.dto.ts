import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '2026-02-01T08:30:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiProperty({ example: '2026-02-01T16:30:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({ example: 'On time', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
