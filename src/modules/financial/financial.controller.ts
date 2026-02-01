import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { QueryFinancialRecordsDto } from './dto/query-financial-records.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';
import { FinancialRecordResponse } from './responses/financial-record.response';
import { FinancialService } from './financial.service';

@ApiTags('Financial')
@ApiBearerAuth()
@ApiExtraModels(FinancialRecordResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @ApiOperation({ summary: 'Create financial record (ADMIN only).' })
  @ApiCreatedResponse({ type: FinancialRecordResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiConflictResponse({ description: 'Financial record already exists for this month' })
  @Roles(Role.ADMIN)
  @Post('records')
  async create(@Body() dto: CreateFinancialRecordDto) {
    return this.financialService.create(dto);
  }

  @ApiOperation({ summary: 'List financial records.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecordResponse' } },
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
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @Get('records')
  async list(@Query() query: QueryFinancialRecordsDto, @CurrentUser() user: any) {
    return this.financialService.list(query, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'List current user financial records.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecordResponse' } },
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
  @Get('records/me')
  async listMine(@Query() query: QueryFinancialRecordsDto, @CurrentUser() user: any) {
    return this.financialService.listMine(query, { id: user.id });
  }

  @ApiOperation({ summary: 'Get financial record by id.' })
  @ApiOkResponse({ type: FinancialRecordResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Financial record not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @Get('records/:id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.financialService.getById(id, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Update financial record (ADMIN only).' })
  @ApiOkResponse({ type: FinancialRecordResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Financial record not found' })
  @ApiConflictResponse({ description: 'Financial record already exists for this month' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch('records/:id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFinancialRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.financialService.update(id, dto, { id: user.id });
  }

  @ApiOperation({ summary: 'Monthly summary report (ADMIN, MANAGER).' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string' },
          totalSalaryPaid: { type: 'number' },
          totalBonuses: { type: 'number' },
          totalDeductions: { type: 'number' },
          countEmployees: { type: 'number' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('summary')
  async summary(@Query() query: QueryFinancialRecordsDto) {
    return this.financialService.summary({
      fromMonth: query.fromMonth,
      toMonth: query.toMonth,
    });
  }
}
