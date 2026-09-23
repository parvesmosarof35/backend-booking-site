import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableZone, TableShape, TableStatus } from '../../database/schemas/table.schema';

export class CreateTableDto {
  @ApiProperty({ example: 'T-01' })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 'Standard' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ enum: TableZone, default: TableZone.INDOOR })
  @IsEnum(TableZone)
  zone: TableZone;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  positionY?: number;

  @ApiPropertyOptional({ enum: TableShape, default: TableShape.ROUND })
  @IsOptional()
  @IsEnum(TableShape)
  shape?: TableShape;

  @ApiPropertyOptional({ enum: TableStatus, default: TableStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
