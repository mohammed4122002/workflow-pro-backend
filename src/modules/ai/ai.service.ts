import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReportType } from '@prisma/client';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { GenerateInsightsDto } from './dto/generate-insights.dto';
import { buildChatUserPrompt, chatSystemPrompt } from './prompts/chat.prompt';
import { buildInsightUserPrompt, insightSystemPrompt } from './prompts/insight.prompt';

@Injectable()
export class AiService {
  private client: OpenAI | null = null;
  private readonly defaultModel = 'gpt-4o-mini';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getClient() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenAI API key is missing.');
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  private getModel() {
    return this.configService.get<string>('OPENAI_MODEL') ?? this.defaultModel;
  }

  private validateRange(rangeFrom?: string, rangeTo?: string) {
    if (!rangeFrom && !rangeTo) return;
    if (!rangeFrom || !rangeTo) {
      throw new BadRequestException('Both rangeFrom and rangeTo are required.');
    }
    const from = new Date(rangeFrom);
    const to = new Date(rangeTo);
    if (to < from) {
      throw new BadRequestException('rangeTo must be after or equal to rangeFrom.');
    }
  }

  private buildSnapshotWhere(type: ReportType, rangeFrom?: string, rangeTo?: string) {
    const where: Prisma.ReportSnapshotWhereInput = { type };
    if (rangeFrom && rangeTo) {
      where.createdAt = {
        gte: new Date(rangeFrom),
        lte: new Date(rangeTo),
      };
    }
    return where;
  }

  private buildSnapshotContext(snapshots: Array<{
    id: string;
    type: ReportType;
    rangeFrom: Date | null;
    rangeTo: Date | null;
    data: Prisma.JsonValue;
    createdAt: Date;
  }>) {
    return snapshots.map((s) => ({
      id: s.id,
      type: s.type,
      rangeFrom: s.rangeFrom ? s.rangeFrom.toISOString().slice(0, 10) : null,
      rangeTo: s.rangeTo ? s.rangeTo.toISOString().slice(0, 10) : null,
      createdAt: s.createdAt.toISOString(),
      data: s.data as Record<string, unknown>,
    }));
  }

  private computeSnapshotHash(ids: string[]) {
    return createHash('sha256').update(ids.join('|')).digest('hex');
  }

  async generateInsights(dto: GenerateInsightsDto) {
    this.validateRange(dto.rangeFrom, dto.rangeTo);

    const where = this.buildSnapshotWhere(dto.type, dto.rangeFrom, dto.rangeTo);
    const snapshots = await this.prisma.reportSnapshot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: dto.maxSnapshots ?? 10,
    });

    if (snapshots.length === 0) {
      throw new NotFoundException('No report snapshots found.');
    }

    const snapshotIds = snapshots.map((s) => s.id);
    const snapshotIdsHash = this.computeSnapshotHash(snapshotIds);
    const cacheKey = `${dto.type}:${dto.rangeFrom ?? ''}:${dto.rangeTo ?? ''}:${snapshotIdsHash}`;

    const cached = await this.prisma.aiInsightCache.findUnique({
      where: { key: cacheKey },
    });
    if (cached) {
      return cached.data as Record<string, unknown>;
    }

    const context = this.buildSnapshotContext(snapshots);
    const client = this.getClient();
    const model = this.getModel();

    let response: any;
    try {
      response = await client.responses.create({
        model,
        temperature: 0.2,
        input: [
          { role: 'system', content: insightSystemPrompt },
          {
            role: 'user',
            content: buildInsightUserPrompt({
              type: dto.type,
              rangeFrom: dto.rangeFrom,
              rangeTo: dto.rangeTo,
              snapshots: context,
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'insights_response',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: { type: 'string' },
                rangeFrom: { type: ['string', 'null'] },
                rangeTo: { type: ['string', 'null'] },
                insights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      detail: { type: 'string' },
                      severity: { type: 'string' },
                    },
                    required: ['title', 'detail', 'severity'],
                  },
                },
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      detail: { type: 'string' },
                    },
                    required: ['title', 'detail'],
                  },
                },
                generatedAt: { type: 'string' },
              },
              required: ['type', 'insights', 'recommendations', 'generatedAt'],
            },
          },
        },
      });
    } catch (error) {
      throw new BadGatewayException('OpenAI request failed.');
    }

    const outputText = response.output_text;
    if (!outputText) {
      throw new BadGatewayException('OpenAI returned an empty response.');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      throw new BadGatewayException('OpenAI returned invalid JSON.');
    }

    await this.prisma.aiInsightCache.create({
      data: {
        key: cacheKey,
        type: dto.type,
        rangeFrom: dto.rangeFrom ? new Date(dto.rangeFrom) : null,
        rangeTo: dto.rangeTo ? new Date(dto.rangeTo) : null,
        snapshotIdsHash,
        data: parsed as Prisma.InputJsonValue,
      },
    });

    return parsed;
  }

  async chat(dto: AiChatDto) {
    this.validateRange(dto.rangeFrom, dto.rangeTo);

    const where = this.buildSnapshotWhere(dto.type, dto.rangeFrom, dto.rangeTo);
    const snapshots = await this.prisma.reportSnapshot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (snapshots.length === 0) {
      throw new NotFoundException('No report snapshots found.');
    }

    const context = this.buildSnapshotContext(snapshots);
    const client = this.getClient();
    const model = this.getModel();

    let response: any;
    try {
      response = await client.responses.create({
        model,
        temperature: 0.2,
        input: [
          { role: 'system', content: chatSystemPrompt },
          {
            role: 'user',
            content: buildChatUserPrompt({
              question: dto.question,
              type: dto.type,
              rangeFrom: dto.rangeFrom,
              rangeTo: dto.rangeTo,
              snapshots: context,
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'chat_response',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                answer: { type: 'string' },
                citations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      snapshotId: { type: 'string' },
                      type: { type: 'string' },
                      createdAt: { type: 'string' },
                    },
                    required: ['snapshotId', 'type', 'createdAt'],
                  },
                },
                followUps: { type: 'array', items: { type: 'string' } },
              },
              required: ['answer', 'citations', 'followUps'],
            },
          },
        },
      });
    } catch (error) {
      throw new BadGatewayException('OpenAI request failed.');
    }

    const outputText = response.output_text;
    if (!outputText) {
      throw new BadGatewayException('OpenAI returned an empty response.');
    }

    try {
      return JSON.parse(outputText);
    } catch (error) {
      throw new BadGatewayException('OpenAI returned invalid JSON.');
    }
  }
}
