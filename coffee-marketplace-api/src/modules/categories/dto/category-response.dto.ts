import { ApiProperty } from '@nestjs/swagger';

/**
 * ------------------------------------------------------------------------
 * Category Response DTO
 * ------------------------------------------------------------------------
 *
 * Standard response model for category resources.
 * ------------------------------------------------------------------------
 */
export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    nullable: true,
  })
  parentId: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
