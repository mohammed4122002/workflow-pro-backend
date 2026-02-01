import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class TaskResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false })
  description!: string | null;

  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;

  @ApiProperty({ required: false })
  dueDate!: Date | null;

  @ApiProperty()
  createdById!: string;

  @ApiProperty({ required: false })
  assignedToId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
