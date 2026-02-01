import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatus, LeaveType } from '@prisma/client';

export class LeaveResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  fromDate!: Date;

  @ApiProperty()
  toDate!: Date;

  @ApiProperty({ enum: LeaveType })
  type!: LeaveType;

  @ApiProperty({ required: false })
  reason!: string | null;

  @ApiProperty({ enum: LeaveStatus })
  status!: LeaveStatus;

  @ApiProperty({ required: false })
  decidedById!: string | null;

  @ApiProperty({ required: false })
  decidedAt!: Date | null;
}
