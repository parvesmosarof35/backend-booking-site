import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmBookingDto {
  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'Parves Mosarof' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Window seat preferred if possible' })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
