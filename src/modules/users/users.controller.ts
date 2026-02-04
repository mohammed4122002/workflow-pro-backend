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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './responses/user.response';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@ApiExtraModels(UserResponse)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create user (ADMIN only).' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiConflictResponse({ description: 'Email already exists' })
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'List users (ADMIN, MANAGER).' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/UserResponse' } },
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
  async list(@Query() query: QueryUsersDto) {
    return this.usersService.list(query);
  }

  @ApiOperation({ summary: 'Get current user profile.' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.usersService.getById({ id: user.id, role: user.role }, user.id);
  }

  @ApiOperation({ summary: 'Get user by id.' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async getById(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.getById({ id: user.id, role: user.role }, id);
  }

  @ApiOperation({ summary: 'Update user (ADMIN only).' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Deactivate user (ADMIN only).' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch(':id/deactivate')
  async deactivate(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.deactivate(id, user.id);
  }

  @ApiOperation({ summary: 'Activate user (ADMIN only).' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch(':id/activate')
  async activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.activate(id);
  }
}
