import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import type { AccessTokenPayload } from './interfaces/jwt-payload.interface';
import type { OtpProofPayload } from './interfaces/otp-proof-payload.interface';

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

  signAccessToken(
    userId: string,
    options?: { deviceId?: string },
  ): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      ...(options?.deviceId ? { deviceId: options.deviceId } : {}),
    };
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

  signOtpProofToken(payload: OtpProofPayload): Promise<string> {
    const expiresIn = (this.config.get<string>('jwt.otpProofExpiresIn') ??
      '15m') as SignOptions['expiresIn'];
    const secret = this.config.getOrThrow<string>('jwt.accessSecret');
    return this.jwtService.signAsync({ ...payload }, { secret, expiresIn });
  }

  async verifyOtpProofToken(token: string): Promise<OtpProofPayload> {
    const secret = this.config.getOrThrow<string>('jwt.accessSecret');
    let decoded: unknown;
    try {
      decoded = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
    const p = this.parseOtpProofPayload(decoded);
    if (!p) {
      throw new UnauthorizedException('Invalid or expired session token');
    }
    return p;
  }

  private parseOtpProofPayload(data: unknown): OtpProofPayload | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const o = data as Record<string, unknown>;
    if (o.typ !== 'otp_proof') {
      return null;
    }
    if (o.purpose === 'register') {
      if (o.channel === 'email') {
        if (typeof o.email !== 'string' || o.email.length === 0) {
          return null;
        }
        return {
          typ: 'otp_proof',
          purpose: 'register',
          channel: 'email',
          email: o.email,
          phoneNumber: null,
        };
      }
      if (o.channel === 'phone') {
        if (typeof o.phoneNumber !== 'string' || o.phoneNumber.length === 0) {
          return null;
        }
        return {
          typ: 'otp_proof',
          purpose: 'register',
          channel: 'phone',
          email: null,
          phoneNumber: o.phoneNumber,
        };
      }
      return null;
    }
    if (o.purpose === 'forgot_password') {
      if (typeof o.userId !== 'string' || o.userId.length === 0) {
        return null;
      }
      return {
        typ: 'otp_proof',
        purpose: 'forgot_password',
        userId: o.userId,
        email: typeof o.email === 'string' ? o.email : null,
        phoneNumber: typeof o.phoneNumber === 'string' ? o.phoneNumber : null,
      };
    }
    return null;
  }
}
