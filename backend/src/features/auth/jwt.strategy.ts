import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
    sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['HS256'],
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET') || 'BFY47382RR3B478R7B378RR4R847YR3489',
        });
    }

    validate(payload: JwtPayload) {
        return { userId: payload.sub };
    }
}