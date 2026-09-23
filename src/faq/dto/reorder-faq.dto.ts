import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FaqOrderItemDto {
  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}

export class ReorderFaqDto {
  @ApiProperty({ type: [FaqOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqOrderItemDto)
  items: FaqOrderItemDto[];
}
