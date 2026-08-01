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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { UsersService } from '../services/user.service';
import {
  AddressResponseDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
  UserResponseDto,
} from '../dto';

/**
 * ------------------------------------------------------------------------
 * Users Controller
 * ------------------------------------------------------------------------
 *
 * Authenticated profile + address endpoints.
 *
 * Auth/login flows must NOT live here — they belong to AuthModule.
 *
 * All routes require a valid Bearer access token.
 * ------------------------------------------------------------------------
 */
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the current authenticated user's profile.
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  async getProfile(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.getProfile(currentUser.sub);
  }

  /**
   * Updates the current authenticated user's profile.
   */
  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(currentUser.sub, dto);
  }

  /**
   * Lists addresses owned by the current user.
   */
  @Get('addresses')
  @ApiOperation({
    summary: 'List current user addresses',
  })
  @ApiOkResponse({
    type: AddressResponseDto,
    isArray: true,
  })
  async getAddresses(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<AddressResponseDto[]> {
    return this.usersService.getAddresses(currentUser.sub);
  }

  /**
   * Creates a new address for the current user.
   */
  @Post('addresses')
  @ApiOperation({
    summary: 'Create address for current user',
  })
  @ApiOkResponse({
    type: AddressResponseDto,
  })
  async createAddress(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.createAddress(currentUser.sub, dto);
  }

  /**
   * Updates one of the current user's addresses.
   */
  @Patch('addresses/:id')
  @ApiOperation({
    summary: 'Update address owned by current user',
  })
  @ApiOkResponse({
    type: AddressResponseDto,
  })
  async updateAddress(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.updateAddress(currentUser.sub, id, dto);
  }

  /**
   * Deletes one of the current user's addresses.
   */
  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete address owned by current user',
  })
  async deleteAddress(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.usersService.deleteAddress(currentUser.sub, id);
  }
}
