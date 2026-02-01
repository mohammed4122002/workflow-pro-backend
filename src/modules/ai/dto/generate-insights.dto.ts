import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateInsightsDto {
  @ApiProperty({ enum: ReportType, example: ReportType.FIN_SUMMARY })
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

  @ApiProperty({ example: 10, required: false, default: 10, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxSnapshots?: number = 10;
}
