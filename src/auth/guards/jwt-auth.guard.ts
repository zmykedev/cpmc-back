import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const HTTP_STATUS_TOKEN_EXPIRED = 498;

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
    console.log('🔐 === JWT AUTH GUARD CONSTRUCTOR ===');
    console.log('🔐 === FIN JWT AUTH GUARD CONSTRUCTOR ===');
  }

  canActivate(context: ExecutionContext) {
    console.log('🔐 === JWT AUTH GUARD CAN ACTIVATE ===');
    const isPublic = this.reflector.get(IS_PUBLIC_KEY, context.getHandler());
    console.log('🌍 Is Public:', isPublic);

    if (isPublic) {
      console.log('✅ Endpoint público, permitiendo acceso');
      return true;
    }

    console.log('🔒 Endpoint protegido, verificando autenticación');
    console.log('🔐 === FIN JWT AUTH GUARD CAN ACTIVATE ===');
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔐 === JWT AUTH GUARD HANDLE REQUEST ===');
    console.log('❌ Error:', err);
    console.log('👤 User:', user);
    console.log('ℹ️ Info:', info);
    console.log('🔐 === FIN JWT AUTH GUARD HANDLE REQUEST ===');

    if (info instanceof jwt.TokenExpiredError) {
      throw new HttpException('Token expired', HTTP_STATUS_TOKEN_EXPIRED);
    }

    if (err || !user) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
