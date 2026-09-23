import { IsBoolean, IsOptional, IsString, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BankDetailsDto {
  @ApiPropertyOptional({ example: 'City Bank Ltd' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'The Royal Grand Bistro' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Banani Branch' })
  @IsOptional()
  @IsString()
  branch?: string;
}

export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  codOnlyMode?: boolean;

  @ApiPropertyOptional({ example: '+8801700000001' })
  @IsOptional()
  @IsString()
  bkashNumber?: string;

  @ApiPropertyOptional({ example: '+8801800000002' })
  @IsOptional()
  @IsString()
  nagadNumber?: string;

  @ApiPropertyOptional({ example: '+8801900000003' })
  @IsOptional()
  @IsString()
  rocketNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;
}
