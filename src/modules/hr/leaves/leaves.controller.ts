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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { DecideLeaveDto } from './dto/decide-leave.dto';
import { QueryLeavesDto } from './dto/query-leaves.dto';
import { LeaveResponse } from './responses/leave.response';
import { LeavesService } from './leaves.service';

@ApiTags('HR - Leaves')
@ApiBearerAuth()
@ApiExtraModels(LeaveResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @ApiOperation({ summary: 'Create leave request (EMPLOYEE only).' })
  @ApiCreatedResponse({ type: LeaveResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Roles(Role.EMPLOYEE)
  @Post()
  async create(@Body() dto: CreateLeaveDto, @CurrentUser() user: any) {
    return this.leavesService.create(dto, { id: user.id });
  }

  @ApiOperation({ summary: 'List leave requests.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/LeaveResponse' } },
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
  @Get()
  async list(@Query() query: QueryLeavesDto, @CurrentUser() user: any) {
    return this.leavesService.list(query, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Get leave request by id.' })
  @ApiOkResponse({ type: LeaveResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Leave request not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.leavesService.getById(id, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Approve/Reject leave (ADMIN, MANAGER).' })
  @ApiOkResponse({ type: LeaveResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Leave request not found' })
  @ApiConflictResponse({ description: 'Leave request already decided' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/decision')
  async decide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DecideLeaveDto,
    @CurrentUser() user: any,
  ) {
    return this.leavesService.decide(id, dto, { id: user.id });
  }
}
