import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { toPublicUser } from '../../common/utils/user-public';
import { PrismaService } from '../../prisma/prisma.service';
import type { AccessTokenPayload } from './interfaces/jwt-payload.interface';
import type { AuthenticatedUser } from './types/authenticated-user.type';
import { AuthErrorMessage } from './auth-errors';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(AuthErrorMessage.INVALID_OR_EXPIRED_SESSION);
    }
    return {
      ...toPublicUser(user),
      ...(payload.deviceId ? { tokenDeviceId: payload.deviceId } : {}),
    };
  }
}
