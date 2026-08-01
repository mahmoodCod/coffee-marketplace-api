import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Create Address DTO
 * ------------------------------------------------------------------------
 *
 * Body for POST /users/addresses.
 * ------------------------------------------------------------------------
 */
export class CreateAddressDto {
  @ApiProperty({
    example: 'Home',
    description: 'Short label for this address',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Tehran',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @ApiProperty({
    example: 'Tehran',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: 'Valiasr St, No. 12',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;
}
