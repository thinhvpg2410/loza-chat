import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export type CallPushPayload = {
  callId: string;
  callType: 'voice' | 'video';
  callerId: string;
  callerName: string;
  callerAvatarUrl: string | null;
  conversationId: string;
  isGroup: boolean;
};

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private messaging: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured — push notifications disabled. ' +
          'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.',
      );
      return;
    }

    try {
      // Lazy import to avoid crash when firebase-admin is not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }

      this.messaging = admin.messaging();
      this.logger.log('Firebase Admin initialized successfully');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin', err);
    }
  }

  async registerPushToken(
    userId: string,
    deviceId: string,
    pushToken: string,
    pushPlatform: 'ios' | 'android',
  ): Promise<void> {
    await this.prisma.userDevice.updateMany({
      where: { userId, deviceId },
      data: { pushToken, pushPlatform },
    });
  }

  async clearPushToken(userId: string, deviceId: string): Promise<void> {
    await this.prisma.userDevice.updateMany({
      where: { userId, deviceId },
      data: { pushToken: null, pushPlatform: null },
    });
  }

  async sendCallNotification(
    invitedUserIds: string[],
    payload: CallPushPayload,
  ): Promise<void> {
    if (!this.messaging) return;

    const devices = await this.prisma.userDevice.findMany({
      where: {
        userId: { in: invitedUserIds },
        isActive: true,
        pushToken: { not: null },
      },
      select: { pushToken: true, pushPlatform: true },
    });

    const tokens = devices
      .map((d) => d.pushToken)
      .filter((t): t is string => Boolean(t));

    if (!tokens.length) return;

    const data: Record<string, string> = {
      type: 'incoming_call',
      callId: payload.callId,
      callType: payload.callType,
      callerId: payload.callerId,
      callerName: payload.callerName,
      callerAvatarUrl: payload.callerAvatarUrl ?? '',
      conversationId: payload.conversationId,
      isGroup: String(payload.isGroup),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin');
      const result = await this.messaging.sendEachForMulticast({
        tokens,
        data,
        notification: {
          title: payload.callerName,
          body:
            payload.callType === 'video'
              ? 'Đang gọi video cho bạn…'
              : 'Đang gọi thoại cho bạn…',
        },
        android: {
          priority: 'high' as const,
          ttl: 30_000,
          notification: {
            channelId: 'incoming_call',
            sound: 'ringtone',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: payload.callerName,
                body:
                  payload.callType === 'video'
                    ? 'Đang gọi video cho bạn…'
                    : 'Đang gọi thoại cho bạn…',
              },
              sound: 'ringtone.wav',
              badge: 1,
            },
          },
        },
      });

      const failed = result.responses.filter((r: any) => !r.success).length;
      if (failed > 0) {
        this.logger.warn(`${failed}/${tokens.length} push notifications failed`);
      }

      // Clean up expired/invalid tokens
      result.responses.forEach((r: any, i: number) => {
        if (
          !r.success &&
          (r.error?.code === 'messaging/registration-token-not-registered' ||
            r.error?.code === 'messaging/invalid-registration-token')
        ) {
          void this.prisma.userDevice
            .updateMany({
              where: { pushToken: tokens[i] },
              data: { pushToken: null },
            })
            .catch(() => {});
        }
      });
    } catch (err) {
      this.logger.error('Failed to send push notifications', err);
    }
  }
}
