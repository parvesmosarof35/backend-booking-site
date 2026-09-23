import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HoldBookingDto {
  @ApiProperty({ example: '2026-09-25' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' })
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  guestCount: number;

  @ApiPropertyOptional({ example: 'Indoor' })
  @IsOptional()
  @IsString()
  preferredZone?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  whatsapp?: string;
}
