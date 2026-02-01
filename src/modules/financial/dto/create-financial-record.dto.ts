import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateFinancialRecordDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: '2026-02' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format.' })
  month!: string;

  @ApiProperty({ example: 1200.0 })
  @IsNumber()
  @Min(0)
  salaryPaid!: number;

  @ApiProperty({ example: 100.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

  @ApiProperty({ example: 50.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiProperty({ example: 'February payroll', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
