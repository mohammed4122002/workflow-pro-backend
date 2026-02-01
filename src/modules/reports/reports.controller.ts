import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GenerateReportDto } from './dto/generate-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ReportResponse } from './responses/report.response';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiExtraModels(ReportResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Generate report snapshot (ADMIN, MANAGER).' })
  @ApiCreatedResponse({ type: ReportResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('generate')
  async generate(@Body() dto: GenerateReportDto) {
    return this.reportsService.generate(dto);
  }

  @ApiOperation({ summary: 'List report snapshots (ADMIN, MANAGER).' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/ReportResponse' } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  async list(@Query() query: QueryReportsDto) {
    return this.reportsService.list(query);
  }

  @ApiOperation({ summary: 'Get report snapshot by id (ADMIN, MANAGER).' })
  @ApiOkResponse({ type: ReportResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reportsService.getById(id);
  }
}
