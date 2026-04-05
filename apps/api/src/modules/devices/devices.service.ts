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

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForLogin(
    userId: string,
    input: DeviceLoginInput,
    db: DeviceDbClient = this.prisma,
  ): Promise<UserDevice> {
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
      },
      update: {
        platform: input.platform,
        appVersion: input.appVersion,
        ...(input.deviceName !== undefined
          ? { deviceName: input.deviceName }
          : {}),
        lastSeenAt: new Date(),
        isActive: true,
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
