import { ApiProperty } from '@nestjs/swagger';

export class TaskCommentResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: Date;
}
