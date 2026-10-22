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
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET') || 'r7mf4sdsALpOnOK3DcFrHniD9C0JPiQNU0NfL_lt7GMRPIFnMyCyV2LXBJncNUkDsp075F16kDUl2QO_eNKzUHMSH4iJDdUeYlrwovmTqkU-r-WHt7y3ztQ6L9J74bo8VFdCck2zQEQghf-8dWy-_SY4wADqj-qGQH88FEr5Fgsa9gobo-EA5UAXe0jSI8YKKlmA1HvvKM9dqR0jddFXkkUIC41VzxNPkIWWrm7fh0TrfI6VWgVnNIE5_7qkhX-BDSE-efP4-IUFSqh3AhooavWsPU-EfH4DA0LtfLpzBeo24vb2Lq-hEyvO4DiE1HCYEPjZNCvcfv_kgo4BPcyUAQ',
        });
    }

    validate(payload: JwtPayload) {
        return { userId: payload.sub };
    }
}