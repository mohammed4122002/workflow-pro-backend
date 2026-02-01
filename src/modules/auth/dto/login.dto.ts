import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@workflowpro.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
