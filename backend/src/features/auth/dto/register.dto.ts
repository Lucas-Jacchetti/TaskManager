import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import {
  normalizeEmail,
  trim,
} from '../../../common/transformers/string.transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Lucas' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'lucas@exemplo.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'senha-segura-123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}