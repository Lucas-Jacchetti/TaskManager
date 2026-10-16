import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeEmail } from '../../../common/transformers/string.transformer';

export class LoginDto {
  @ApiProperty({ example: 'lucas@exemplo.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha-segura-123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}