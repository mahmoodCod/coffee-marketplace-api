import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateArticleDto {
  // Article title displayed to users
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // Unique URL-friendly identifier for the article
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  slug: string;

  // Short summary of the article
  @IsString()
  @IsOptional()
  excerpt?: string;

  // Main article content
  @IsString()
  @IsNotEmpty()
  content: string;

  // Optional article thumbnail URL
  @IsUrl()
  @IsOptional()
  thumbnail?: string;

  // Optional badge displayed on the article
  @IsString()
  @IsOptional()
  @MaxLength(50)
  badge?: string;

  // Estimated reading time in minutes
  @IsInt()
  @Min(1)
  @IsOptional()
  readTime?: number;
}
