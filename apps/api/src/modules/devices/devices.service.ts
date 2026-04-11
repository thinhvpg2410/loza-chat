import { Injectable } from '@nestjs/common';
import type { Prisma, UserDevice } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type DeviceDbClient = Prisma.TransactionClient | PrismaService;

export type DeviceLoginInput = {
  deviceId: string;
  platform: string;
  appVersion: string;
  deviceName?: string;
};

export type UpsertDeviceOptions = {
  /** When true, mark device as trusted (registration or login device OTP). */
  markTrusted?: boolean;
};

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForLogin(
    userId: string,
    input: DeviceLoginInput,
    db: DeviceDbClient = this.prisma,
    options?: UpsertDeviceOptions,
  ): Promise<UserDevice> {
    const markTrusted = options?.markTrusted === true;
    return db.userDevice.upsert({
      where: {
        userId_deviceId: { userId, deviceId: input.deviceId },
      },
      create: {
        userId,
        deviceId: input.deviceId,
        platform: input.platform,
        appVersion: input.appVersion,
        deviceName: input.deviceName ?? null,
        lastSeenAt: new Date(),
        isTrusted: markTrusted,
      },
      update: {
        platform: input.platform,
        appVersion: input.appVersion,
        ...(input.deviceName !== undefined
          ? { deviceName: input.deviceName }
          : {}),
        lastSeenAt: new Date(),
        isActive: true,
        ...(markTrusted ? { isTrusted: true } : {}),
      },
    });
  }

  async listForUser(userId: string): Promise<UserDevice[]> {
    return this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }
}
