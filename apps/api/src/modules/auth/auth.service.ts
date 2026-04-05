import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthTokensResponse } from './interfaces/auth-tokens-response.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { OtpService } from './otp.service';

const ACCESS_EXPIRES = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string }> {
    await this.otpService.createAndStoreOtp(phone);
    return { message: 'OTP sent (check server logs in development)' };
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthTokensResponse> {
    const valid = await this.otpService.verifyAndConsumeOtp(phone, otp);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });

    return this.issueTokensForUser(user);
  }

  async refreshAccessToken(
    refreshTokenRaw: string,
  ): Promise<{ access_token: string }> {
    const tokenHash = this.hashRefreshToken(refreshTokenRaw);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      if (record) {
        await this.prisma.refreshToken.delete({ where: { id: record.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const access_token = await this.signAccessToken(record.user);
    return { access_token };
  }

  async logout(refreshTokenRaw: string): Promise<{ message: string }> {
    const tokenHash = this.hashRefreshToken(refreshTokenRaw);
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
    });
    if (deleted.count === 0) {
      this.logger.debug('Logout: refresh token not found (idempotent)');
    }
    return { message: 'Logged out' };
  }

  private hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  private async issueTokensForUser(user: User): Promise<AuthTokensResponse> {
    const access_token = await this.signAccessToken(user);
    const refresh_token = randomBytes(32).toString('hex');
    const tokenHash = this.hashRefreshToken(refresh_token);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    return this.jwtService.signAsync(payload, { expiresIn: ACCESS_EXPIRES });
  }
}
