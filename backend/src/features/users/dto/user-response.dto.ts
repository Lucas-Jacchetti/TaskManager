import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lucas' })
  name: string;

  @ApiProperty({ example: 'lucas@exemplo.com' })
  email: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  }
}