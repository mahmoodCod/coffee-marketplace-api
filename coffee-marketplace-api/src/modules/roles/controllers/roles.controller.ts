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
import { RolesService } from '../services/roles.service';
import { CreateRoleDto, RoleResponseDto, UpdateRoleDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Roles Controller
 * ------------------------------------------------------------------------
 *
 * Exposes RESTful endpoints for managing application roles.
 *
 * Responsibilities:
 * - Receive HTTP requests
 * - Validate incoming DTOs
 * - Delegate business logic to RolesService
 * - Return API responses
 *
 * Notes:
 * Controllers should never contain business logic.
 * ------------------------------------------------------------------------
 */
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Returns every available role.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all roles',
  })
  @ApiOkResponse({
    type: RoleResponseDto,
    isArray: true,
  })
  async findAll() {
    return this.rolesService.findAll();
  }

  /**
   * Returns one role.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get role by id',
  })
  @ApiParam({
    name: 'id',
  })
  @ApiOkResponse({
    type: RoleResponseDto,
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findById(id);
  }

  /**
   * Creates a new role.
   */
  @Post()
  @ApiOperation({
    summary: 'Create role',
  })
  @ApiCreatedResponse({
    type: RoleResponseDto,
  })
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  /**
   * Updates an existing role.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update role',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,

    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  /**
   * Deletes an existing role.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete role',
  })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.delete(id);
  }
}
