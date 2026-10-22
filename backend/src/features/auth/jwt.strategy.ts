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
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET') || 'vYpXBsV6VL5WPrAaoMsvZoF1j4wvpPRjAgl0ar11Zlt',
        });
    }

    validate(payload: JwtPayload) {
        return { userId: payload.sub };
    }
}