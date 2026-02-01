import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ required: false })
  department!: string | null;

  @ApiProperty()
  isActive!: boolean;
}
