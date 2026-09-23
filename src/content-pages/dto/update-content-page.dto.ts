import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContentPageDto {
  @ApiProperty({ example: '<h2>About Our Heritage</h2><p>Founded with passion...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
