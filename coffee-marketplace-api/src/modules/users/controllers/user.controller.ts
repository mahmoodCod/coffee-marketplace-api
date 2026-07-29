import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from '../services/user.service';

import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Users Controller
 * ------------------------------------------------------------------------
 *
 * HTTP layer for User resource.
 *
 * Responsibilities:
 * - Handle HTTP requests
 * - Validate route parameters
 * - Delegate operations to UsersService
 *
 * Business logic MUST NOT exist here.
 * ------------------------------------------------------------------------
 */

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new user',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  /**
   * Returns all users.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all users',
  })
  @ApiResponse({
    status: 200,
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  /**
   * Returns one user by id.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  async findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  /**
   * Updates user information.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
  })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
  })
  async update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  /**
   * Deletes user.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
  })
  @ApiNoContentResponse({
    description: 'User deleted successfully',
  })
  async remove(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ): Promise<void> {
    return this.usersService.delete(id);
  }
}
