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
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceResponse } from './responses/attendance.response';
import { AttendanceService } from './attendance.service';

@ApiTags('HR - Attendance')
@ApiBearerAuth()
@ApiExtraModels(AttendanceResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Create attendance record (ADMIN, MANAGER).' })
  @ApiCreatedResponse({ type: AttendanceResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiConflictResponse({ description: 'Attendance already exists for this date' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @ApiOperation({ summary: 'List attendance records.' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/AttendanceResponse' } },
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
  @Get()
  async list(@Query() query: QueryAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.list(query, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Get attendance by id.' })
  @ApiOkResponse({ type: AttendanceResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Attendance not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.getById(id, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Update attendance (ADMIN, MANAGER).' })
  @ApiOkResponse({ type: AttendanceResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Attendance not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(id, dto);
  }
}
