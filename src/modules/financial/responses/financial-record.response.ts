import { ApiProperty } from '@nestjs/swagger';

export class FinancialRecordResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  month!: string;

  @ApiProperty()
  salaryPaid!: number;

  @ApiProperty()
  bonuses!: number;

  @ApiProperty()
  deductions!: number;

  @ApiProperty({ required: false })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
