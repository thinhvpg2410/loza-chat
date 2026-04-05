import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User, UserDevice } from '@prisma/client';
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

    const refreshRaw = this.tokens.generateRefreshToken();
    const tokenHash = this.tokens.hashRefreshToken(refreshRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    const { user, device } = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.upsert({
        where: { phoneNumber: dto.phoneNumber },
        create: {
          phoneNumber: dto.phoneNumber,
          displayName: `User ${dto.phoneNumber.slice(-4)}`,
        },
        update: {},
      });

      if (!u.isActive) {
        throw new UnauthorizedException('Account is disabled');
      }

      const d: UserDevice = await this.devices.upsertForLogin(
        u.id,
        {
          deviceId: dto.deviceId,
          platform: dto.platform,
          appVersion: dto.appVersion,
          deviceName: dto.deviceName,
        },
        tx,
      );

      await tx.refreshToken.updateMany({
        where: {
          userDeviceId: d.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          userId: u.id,
          userDeviceId: d.id,
          tokenHash,
          expiresAt,
        },
      });

      return { user: u, device: d };
    });

    const accessToken = await this.tokens.signAccessToken(user.id, {
      deviceId: device.deviceId,
    });

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
    const newRaw = this.tokens.generateRefreshToken();
    const newHash = this.tokens.hashRefreshToken(newRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();
    const now = new Date();

    const { userId, deviceId } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true, userDevice: true },
      });

      if (
        !existing ||
        existing.revokedAt !== null ||
        existing.expiresAt <= now ||
        !existing.user.isActive
      ) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const revoked = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 0) {
        throw new UnauthorizedException('Invalid or expired session');
      }

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

      return {
        userId: existing.userId,
        deviceId: existing.userDevice.deviceId,
      };
    });

    const accessToken = await this.tokens.signAccessToken(userId, {
      deviceId,
    });

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
