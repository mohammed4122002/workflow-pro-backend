import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';

class InsightItem {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  detail!: string;

  @ApiProperty({ example: 'medium' })
  severity!: string;
}

class RecommendationItem {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  detail!: string;
}

export class InsightsResponse {
  @ApiProperty({ enum: ReportType })
  type!: ReportType;

  @ApiProperty({ required: false })
  rangeFrom!: string | null;

  @ApiProperty({ required: false })
  rangeTo!: string | null;

  @ApiProperty({ type: [InsightItem] })
  insights!: InsightItem[];

  @ApiProperty({ type: [RecommendationItem] })
  recommendations!: RecommendationItem[];

  @ApiProperty()
  generatedAt!: string;
}
