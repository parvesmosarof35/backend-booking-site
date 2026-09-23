import { IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSlotsDto {
  @ApiProperty({ example: 60, description: 'Slot duration in minutes (e.g. 30 or 60)' })
  @IsNumber()
  @Min(15)
  @Max(240)
  @IsNotEmpty()
  intervalMinutes: number;

  @ApiPropertyOptional({ example: 30, description: 'Max seating capacity per slot' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  slotCapacity?: number;
}
