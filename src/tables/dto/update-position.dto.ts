import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableZone } from '../../database/schemas/table.schema';

export class UpdateTablePositionDto {
  @ApiProperty({ example: 150 })
  @IsNumber()
  @IsNotEmpty()
  positionX: number;

  @ApiProperty({ example: 220 })
  @IsNumber()
  @IsNotEmpty()
  positionY: number;

  @ApiPropertyOptional({ enum: TableZone })
  @IsOptional()
  @IsEnum(TableZone)
  zone?: TableZone;
}
