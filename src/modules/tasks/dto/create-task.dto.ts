import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare monthly report' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Collect and summarize financial data', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ example: '2026-02-15', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
