import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'employee2@workflowpro.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Employee Two' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.EMPLOYEE })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ example: 'HR', required: false })
  @IsOptional()
  @IsString()
  department?: string;
}
