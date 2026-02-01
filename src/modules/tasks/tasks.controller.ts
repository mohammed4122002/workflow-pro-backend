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
import { AddCommentDto } from './dto/add-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskCommentResponse } from './responses/task-comment.response';
import { TaskResponse } from './responses/task.response';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiExtraModels(TaskResponse, TaskCommentResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Create task (ADMIN, MANAGER).' })
  @ApiCreatedResponse({ type: TaskResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(dto, { id: user.id });
  }

  @ApiOperation({ summary: 'List tasks (ADMIN/MANAGER all, EMPLOYEE assigned only).' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/TaskResponse' } },
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
  async list(@Query() query: QueryTasksDto, @CurrentUser() user: any) {
    return this.tasksService.list(query, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Get task details.' })
  @ApiOkResponse({ type: TaskResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getById(id, { id: user.id, role: user.role });
  }

  @ApiOperation({
    summary: 'Update task (ADMIN/MANAGER all fields, EMPLOYEE status only).',
  })
  @ApiOkResponse({ type: TaskResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiConflictResponse({ description: 'Invalid task status transition' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, dto, { id: user.id, role: user.role });
  }

  @ApiOperation({ summary: 'Add comment to task.' })
  @ApiCreatedResponse({ type: TaskCommentResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Post(':id/comments')
  async addComment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.addComment(id, dto, {
      id: user.id,
      role: user.role,
    });
  }

  @ApiOperation({ summary: 'List task comments.' })
  @ApiOkResponse({ type: TaskCommentResponse, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id/comments')
  async listComments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.listComments(id, { id: user.id, role: user.role });
  }
}
