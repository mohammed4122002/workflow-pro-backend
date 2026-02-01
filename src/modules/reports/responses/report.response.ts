import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';

export class ReportResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ReportType })
  type!: ReportType;

  @ApiProperty({ required: false })
  rangeFrom!: Date | null;

  @ApiProperty({ required: false })
  rangeTo!: Date | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  data!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;
}
