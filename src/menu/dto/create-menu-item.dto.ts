import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Grilled Ribeye Steak' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Prime Australian ribeye served with roasted garlic butter and herb potatoes.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1450 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1544025162-d76694265947' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'Main Course' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
