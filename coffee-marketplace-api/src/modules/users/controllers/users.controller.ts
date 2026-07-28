import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto';

import { UsersService } from '../services/users.service';

/**
 * ------------------------------------------------------------------------
 * Users Controller
 * ------------------------------------------------------------------------
 *
 * Exposes RESTful endpoints for managing users.
 *
 * Responsibilities:
 * - Receive HTTP requests
 * - Validate incoming DTOs
 * - Delegate business logic to UsersService
 * - Return API responses
 *
 * Notes:
 * Controllers should never contain business logic.
 * ------------------------------------------------------------------------
 */

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns every registered user.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all users',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    isArray: true,
  })
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Returns one user.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
  })
  @ApiParam({
    name: 'id',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  async findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.usersService.findById(id);
  }

  /**
   * Creates a new user.
   */
  @Post()
  @ApiOperation({
    summary: 'Create user',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  async create(
    @Body()
    dto: CreateUserDto,
  ) {
    return this.usersService.create(dto);
  }

  /**
   * Updates an existing user.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
  })
  async update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  /**
   * Deletes a user.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
  })
  async delete(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.usersService.delete(id);
  }
}
