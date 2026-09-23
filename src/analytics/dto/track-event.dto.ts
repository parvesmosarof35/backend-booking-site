import { IsNotEmpty, IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AnalyticsEventType,
  AnalyticsTargetType,
} from '../../database/schemas/analytics-event.schema';

export class TrackEventDto {
  @ApiProperty({ enum: AnalyticsEventType, example: AnalyticsEventType.CLICK })
  @IsEnum(AnalyticsEventType)
  @IsNotEmpty()
  type: AnalyticsEventType;

  @ApiProperty({ enum: AnalyticsTargetType, example: AnalyticsTargetType.MENU_ITEM })
  @IsEnum(AnalyticsTargetType)
  @IsNotEmpty()
  targetType: AnalyticsTargetType;

  @ApiProperty({ example: '65f1234567890abcdef12345' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
