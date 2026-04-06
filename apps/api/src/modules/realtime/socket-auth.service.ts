import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import type { AccessTokenPayload } from '../auth/interfaces/jwt-payload.interface';

export interface SocketAuthContext {
  user: User;
  deviceId?: string;
}

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticateHandshake(
    handshake: Socket['handshake'],
  ): Promise<SocketAuthContext> {
    const token = this.extractBearerToken(handshake);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not available');
    }

    return {
      user,
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    };
  }

  private extractBearerToken(handshake: Socket['handshake']): string | null {
    const auth = handshake.auth as Record<string, unknown> | undefined;
    const fromAuth = typeof auth?.token === 'string' ? auth.token.trim() : '';
    if (fromAuth.length > 0) {
      return fromAuth;
    }

    const header = handshake.headers.authorization;
    if (
      typeof header === 'string' &&
      header.toLowerCase().startsWith('bearer ')
    ) {
      return header.slice(7).trim();
    }

    const q = handshake.query?.token;
    if (typeof q === 'string' && q.length > 0) {
      return q.trim();
    }
    if (Array.isArray(q) && typeof q[0] === 'string' && q[0].length > 0) {
      return q[0].trim();
    }

    return null;
  }
}
