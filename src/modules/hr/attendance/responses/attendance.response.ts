import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty({ required: false })
  checkIn!: Date | null;

  @ApiProperty({ required: false })
  checkOut!: Date | null;

  @ApiProperty({ enum: AttendanceStatus })
  status!: AttendanceStatus;

  @ApiProperty({ required: false })
  note!: string | null;
}
