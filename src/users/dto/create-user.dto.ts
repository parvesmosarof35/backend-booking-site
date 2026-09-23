import { IsEmail, IsNotEmpty, IsEnum, MinLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'John Staff' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'staff1@restaurant.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+8801711223344' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'StaffPass@123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.STAFF })
  @IsEnum(UserRole)
  role: UserRole;
}
