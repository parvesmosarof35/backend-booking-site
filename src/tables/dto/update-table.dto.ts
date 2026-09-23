import { IsOptional, IsNumber, IsEnum, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TableZone, TableShape, TableStatus } from '../../database/schemas/table.schema';

export class UpdateTableDto {
  @ApiPropertyOptional({ example: 'T-01' })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'Standard' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: TableZone })
  @IsOptional()
  @IsEnum(TableZone)
  zone?: TableZone;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsNumber()
  positionY?: number;

  @ApiPropertyOptional({ enum: TableShape })
  @IsOptional()
  @IsEnum(TableShape)
  shape?: TableShape;

  @ApiPropertyOptional({ enum: TableStatus })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
