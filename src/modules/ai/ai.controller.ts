import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadGatewayResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiChatDto } from './dto/ai-chat.dto';
import { GenerateInsightsDto } from './dto/generate-insights.dto';
import { AiChatResponse } from './responses/ai-chat.response';
import { InsightsResponse } from './responses/insights.response';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@ApiExtraModels(InsightsResponse, AiChatResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({
    summary:
      'Generate insights from report snapshots (ADMIN, MANAGER). Uses aggregated data only.',
  })
  @ApiCreatedResponse({ type: InsightsResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'No report snapshots found' })
  @ApiServiceUnavailableResponse({ description: 'OpenAI API key is missing' })
  @ApiBadGatewayResponse({ description: 'OpenAI request failed' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('insights')
  async insights(@Body() dto: GenerateInsightsDto) {
    return this.aiService.generateInsights(dto);
  }

  @ApiOperation({
    summary:
      'Ask questions over report snapshots (ADMIN, MANAGER). Responses cite snapshot IDs.',
  })
  @ApiOkResponse({ type: AiChatResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'No report snapshots found' })
  @ApiServiceUnavailableResponse({ description: 'OpenAI API key is missing' })
  @ApiBadGatewayResponse({ description: 'OpenAI request failed' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('chat')
  async chat(@Body() dto: AiChatDto) {
    return this.aiService.chat(dto);
  }
}
