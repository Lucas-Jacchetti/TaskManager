import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @ApiCreatedResponse({
        description: 'Usuário cadastrado com sucesso',
    })
    @ApiBadRequestResponse({
        description: 'Dados de cadastro inválidos',
    })
    @ApiConflictResponse({
        description: 'E-mail já cadastrado',
    })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @ApiOkResponse({
        description: 'Autenticação realizada com sucesso; retorna o token JWT',
        schema: {
        example: {
            access_token: '<token-jwt>',
        },
        },
    })
    @ApiBadRequestResponse({
        description: 'Dados de login inválidos',
    })
    @ApiUnauthorizedResponse({
        description: 'E-mail ou senha inválidos',
    })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse({ type: UserResponseDto, description: 'Dados do usuário autenticado' })
    @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado' })
    me(@CurrentUserId() userId: string): Promise<UserResponseDto> {
        return this.authService.me(userId);
    }
}
