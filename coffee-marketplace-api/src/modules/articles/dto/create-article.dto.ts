import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  // Article title displayed to users
  @ApiProperty({
    example: 'How to Choose the Right Coffee Beans',
    description: 'The title of the article',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // Unique URL-friendly identifier for the article
  @ApiProperty({
    example: 'how-to-choose-the-right-coffee-beans',
    description: 'A unique URL-friendly identifier for the article',
    maxLength: 220,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  slug: string;

  // Short summary of the article
  @ApiPropertyOptional({
    example: 'A practical guide to choosing coffee beans based on roast and flavor.',
    description: 'A short summary of the article',
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  // Main article content
  @ApiProperty({
    example:
      'Choosing the right coffee beans depends on roast level, origin, and brewing method.',
    description: 'The main content of the article',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  // Optional article thumbnail URL
  @ApiPropertyOptional({
    example: 'https://example.com/images/coffee-beans.jpg',
    description: 'The URL of the article thumbnail',
  })
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  // Optional badge displayed on the article
  @ApiPropertyOptional({
    example: 'Coffee Guide',
    description: 'A small badge displayed on the article',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  badge?: string;

  // Estimated reading time in minutes
  @ApiPropertyOptional({
    example: 5,
    description: 'Estimated reading time in minutes',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  readTime?: number;
}
