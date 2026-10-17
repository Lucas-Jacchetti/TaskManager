import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { UsersService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

const BCRYPT_ROUNDS = 12;
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.usersService.create({
        name: dto.name,
        email: dto.email,
        password,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    const hash = user?.password ?? (await this.getDummyHash());
    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });

    return { access_token: accessToken };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= bcrypt.hash('senha-fictícia-para-igualar-tempo', BCRYPT_ROUNDS);
    return this.dummyHash;
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return UserResponseDto.fromEntity(user);
  }
}