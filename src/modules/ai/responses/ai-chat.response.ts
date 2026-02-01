import { ApiProperty } from '@nestjs/swagger';

class CitationItem {
  @ApiProperty()
  snapshotId!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  createdAt!: string;
}

export class AiChatResponse {
  @ApiProperty()
  answer!: string;

  @ApiProperty({ type: [CitationItem] })
  citations!: CitationItem[];

  @ApiProperty({ type: [String] })
  followUps!: string[];
}
