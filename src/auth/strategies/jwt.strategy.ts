import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import config from '../../config';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(config.KEY)
    configService: ConfigType<typeof config>,
  ) {
    console.log('🔑 === JWT STRATEGY CONSTRUCTOR START ===');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.jwtSecret,
    });

    console.log('🔑 === JWT STRATEGY CONSTRUCTOR ===');
    console.log(
      '🔐 Secret configurado:',
      configService.jwt.jwtSecret ? 'SÍ' : 'NO',
    );
    console.log('🔐 Secret valor:', configService.jwt.jwtSecret);
    console.log('🔑 === FIN JWT STRATEGY CONSTRUCTOR ===');
  }

  validate(payload: PayloadToken) {
    console.log('🔑 === JWT STRATEGY VALIDATE ===');
    console.log('📦 Payload completo:', payload);
    console.log('🆔 User ID:', payload.id);
    console.log('🔑 === FIN JWT STRATEGY VALIDATE ===');

    if (!payload.id) {
      console.log('❌ Payload inválido - falta ID de usuario');
      return null;
    }

    return payload;
  }
}
