import { ApiProperty } from '@nestjs/swagger';

/**
 * ------------------------------------------------------------------------
 * Address Response DTO
 * ------------------------------------------------------------------------
 */
export class AddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    example: 'Home',
  })
  title: string;

  @ApiProperty({
    example: 'Tehran',
  })
  province: string;

  @ApiProperty({
    example: 'Tehran',
  })
  city: string;

  @ApiProperty({
    example: 'Valiasr St, No. 12',
  })
  street: string;

  @ApiProperty({
    example: '1234567890',
  })
  postalCode: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
