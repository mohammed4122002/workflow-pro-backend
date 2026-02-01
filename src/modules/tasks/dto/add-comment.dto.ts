import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ example: 'Task completed, awaiting review.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
