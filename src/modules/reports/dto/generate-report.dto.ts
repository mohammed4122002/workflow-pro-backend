import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, example: ReportType.HR_SUMMARY })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiProperty({ example: '2026-02-01', required: false })
  @IsOptional()
  @IsDateString()
  rangeFrom?: string;

  @ApiProperty({ example: '2026-02-28', required: false })
  @IsOptional()
  @IsDateString()
  rangeTo?: string;
}
