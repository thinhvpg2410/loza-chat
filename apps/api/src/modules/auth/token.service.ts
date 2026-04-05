import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { AccessTokenPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  signAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  getAccessExpiresInSeconds(): number {
    const expiresIn = this.config.get<string>('jwt.accessExpiresIn') ?? '15m';
    const match = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
    if (!match) {
      return 900;
    }
    const n = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86400;
      default:
        return 900;
    }
  }

  getRefreshExpiresAt(): Date {
    const days = this.config.get<number>('jwt.refreshExpiresDays') ?? 30;
    return new Date(Date.now() + days * 86400000);
  }
}
