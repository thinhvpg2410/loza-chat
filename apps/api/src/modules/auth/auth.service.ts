import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpRequestsService } from './otp-requests.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpRequests: OtpRequestsService,
    private readonly tokens: TokenService,
    private readonly devices: DevicesService,
  ) {}

  async requestOtp(
    phoneNumber: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ message: string }> {
    await this.otpRequests.startOtpRequest(phoneNumber, ipAddress, userAgent);
    return { message: 'Verification code sent' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
    device: { id: string; deviceId: string; platform: string };
  }> {
    await this.otpRequests.verifyOtpAndConsume(dto.phoneNumber, dto.otp);

    const user = await this.prisma.user.upsert({
      where: { phoneNumber: dto.phoneNumber },
      create: {
        phoneNumber: dto.phoneNumber,
        displayName: `User ${dto.phoneNumber.slice(-4)}`,
      },
      update: {},
    });

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const device = await this.devices.upsertForLogin(user.id, {
      deviceId: dto.deviceId,
      platform: dto.platform,
      appVersion: dto.appVersion,
      deviceName: dto.deviceName,
    });

    const refreshRaw = this.tokens.generateRefreshToken();
    const tokenHash = this.tokens.hashRefreshToken(refreshRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: {
          userDeviceId: device.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          userDeviceId: device.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const accessToken = await this.tokens.signAccessToken(user.id);

    return {
      accessToken,
      refreshToken: refreshRaw,
      expiresIn: this.tokens.getAccessExpiresInSeconds(),
      user,
      device: {
        id: device.id,
        deviceId: device.deviceId,
        platform: device.platform,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const now = new Date();

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!existing || existing.revokedAt !== null || existing.expiresAt <= now) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (!existing.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const newRaw = this.tokens.generateRefreshToken();
    const newHash = this.tokens.hashRefreshToken(newRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
      await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          userDeviceId: existing.userDeviceId,
          tokenHash: newHash,
          expiresAt,
        },
      });
      await tx.userDevice.update({
        where: { id: existing.userDeviceId },
        data: { lastSeenAt: new Date() },
      });
    });

    const accessToken = await this.tokens.signAccessToken(existing.userId);

    return {
      accessToken,
      refreshToken: newRaw,
      expiresIn: this.tokens.getAccessExpiresInSeconds(),
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const now = new Date();
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return { message: 'Logged out' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out from all devices' };
  }
}
