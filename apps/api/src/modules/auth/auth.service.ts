import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, User, UserDevice } from '@prisma/client';
import { QrLoginSessionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { AppConfiguration } from '../../config/configuration';
import { OtpPurpose } from '../../common/constants/otp-purpose';
import { parseLoginIdentifier } from '../../common/utils/contact-identifiers';
import { toPublicUser } from '../../common/utils/user-public';
import type { PublicUser } from '../../common/utils/user-public';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import type { CreateAccountDto } from './dto/create-account.dto';
import type { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import type { LoginDto } from './dto/login.dto';
import type { QrCreateDto } from './dto/qr-create.dto';
import type { VerifyContactOtpDto } from './dto/contact-otp.dto';
import type { VerifyLoginDeviceOtpDto } from './dto/verify-login-device-otp.dto';
import type { LoginDeviceChallengePayload } from './interfaces/login-device-challenge-payload.interface';
import type { OtpProofPayload } from './interfaces/otp-proof-payload.interface';
import { OtpRequestsService } from './otp-requests.service';
import { TokenService } from './token.service';

const PASSWORD_BCRYPT_ROUNDS = 12;

export type LoginSessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
  device: { id: string; deviceId: string; platform: string };
};

export type LoginResult =
  | ({ requiresDeviceVerification: false } & LoginSessionPayload)
  | {
      requiresDeviceVerification: true;
      deviceVerificationToken: string;
      otpChannel: 'phone' | 'email';
    };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpRequests: OtpRequestsService,
    private readonly tokens: TokenService,
    private readonly devices: DevicesService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async registerRequestOtp(
    phoneNumber: string | undefined,
    email: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ message: string }> {
    if (email) {
      const taken = await this.prisma.user.findUnique({
        where: { email },
      });
      if (taken) {
        throw new ConflictException('Email already registered');
      }
    }
    if (phoneNumber) {
      const taken = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (taken) {
        throw new ConflictException('Phone number already registered');
      }
    }

    await this.otpRequests.startOtpRequest(
      OtpPurpose.REGISTER,
      phoneNumber,
      email,
      ipAddress,
      userAgent,
    );
    return { message: 'Verification code sent' };
  }

  async registerVerifyOtp(
    dto: VerifyContactOtpDto,
  ): Promise<{ token: string }> {
    if (dto.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (taken) {
        throw new ConflictException('Email already registered');
      }
    }
    if (dto.phoneNumber) {
      const taken = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (taken) {
        throw new ConflictException('Phone number already registered');
      }
    }

    await this.otpRequests.verifyOtpAndConsume(
      OtpPurpose.REGISTER,
      dto.phoneNumber,
      dto.email,
      dto.otp,
    );

    let proof: OtpProofPayload;
    if (dto.email) {
      proof = {
        typ: 'otp_proof',
        purpose: 'register',
        channel: 'email',
        email: dto.email,
        phoneNumber: null,
      };
    } else {
      proof = {
        typ: 'otp_proof',
        purpose: 'register',
        channel: 'phone',
        email: null,
        phoneNumber: dto.phoneNumber!,
      };
    }

    const token = await this.tokens.signOtpProofToken(proof);
    return { token };
  }

  async createAccount(dto: CreateAccountDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUser;
    device: { id: string; deviceId: string; platform: string };
  }> {
    const proof = await this.tokens.verifyOtpProofToken(dto.token);
    if (proof.purpose !== 'register') {
      throw new BadRequestException('Invalid token for account creation');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_BCRYPT_ROUNDS);

    if (proof.channel === 'email') {
      return this.createUserWithSession(
        {
          email: proof.email,
          phoneNumber: null,
          passwordHash,
          displayName: dto.displayName,
        },
        {
          deviceId: dto.deviceId,
          platform: dto.platform,
          appVersion: dto.appVersion,
          deviceName: dto.deviceName,
        },
      );
    }
    return this.createUserWithSession(
      {
        email: null,
        phoneNumber: proof.phoneNumber,
        passwordHash,
        displayName: dto.displayName,
      },
      {
        deviceId: dto.deviceId,
        platform: dto.platform,
        appVersion: dto.appVersion,
        deviceName: dto.deviceName,
      },
    );
  }

  private async createUserWithSession(
    data: {
      email: string | null;
      phoneNumber: string | null;
      passwordHash: string;
      displayName?: string;
    },
    device: {
      deviceId: string;
      platform: string;
      appVersion: string;
      deviceName?: string;
    },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUser;
    device: { id: string; deviceId: string; platform: string };
  }> {
    if (!data.email && !data.phoneNumber) {
      throw new BadRequestException('Account must have email or phone');
    }

    if (data.email) {
      const e = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (e) {
        throw new ConflictException('Email already registered');
      }
    }
    if (data.phoneNumber) {
      const p = await this.prisma.user.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });
      if (p) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const displayName =
      data.displayName?.trim() ||
      (data.email
        ? data.email.split('@')[0] ?? 'User'
        : `User ${data.phoneNumber!.slice(-4)}`);

    const refreshRaw = this.tokens.generateRefreshToken();
    const tokenHash = this.tokens.hashRefreshToken(refreshRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    const { user, deviceRow } = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          phoneNumber: data.phoneNumber,
          passwordHash: data.passwordHash,
          displayName,
        },
      });

      const d: UserDevice = await this.devices.upsertForLogin(
        u.id,
        {
          deviceId: device.deviceId,
          platform: device.platform,
          appVersion: device.appVersion,
          deviceName: device.deviceName,
        },
        tx,
        { markTrusted: true },
      );

      await tx.refreshToken.create({
        data: {
          userId: u.id,
          userDeviceId: d.id,
          tokenHash,
          expiresAt,
        },
      });

      return { user: u, deviceRow: d };
    });

    const accessToken = await this.tokens.signAccessToken(user.id, {
      deviceId: deviceRow.deviceId,
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      expiresIn: this.tokens.getAccessExpiresInSeconds(),
      user: toPublicUser(user),
      device: {
        id: deviceRow.id,
        deviceId: deviceRow.deviceId,
        platform: deviceRow.platform,
      },
    };
  }

  async login(
    dto: LoginDto,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<LoginResult> {
    const id = parseLoginIdentifier(dto.identifier);
    const user = await this.prisma.user.findFirst({
      where:
        id.kind === 'email'
          ? { email: id.email }
          : { phoneNumber: id.phoneNumber },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existing = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceId: { userId: user.id, deviceId: dto.deviceId },
      },
    });

    if (existing?.isTrusted === true) {
      const session = await this.openPasswordSession(user, dto, {});
      return { requiresDeviceVerification: false, ...session };
    }

    const dest = this.resolveLoginDeviceOtpDestination(user);
    await this.otpRequests.startOtpRequest(
      OtpPurpose.LOGIN_DEVICE,
      dest.phoneNumber,
      dest.email,
      ipAddress,
      userAgent,
    );

    const challenge: LoginDeviceChallengePayload = {
      typ: 'login_device_challenge',
      userId: user.id,
      deviceId: dto.deviceId,
      platform: dto.platform,
      appVersion: dto.appVersion,
      deviceName: dto.deviceName?.trim() ? dto.deviceName.trim() : null,
      otpChannel: dest.otpChannel,
      otpPhone: dest.phoneNumber ?? null,
      otpEmail: dest.email ?? null,
    };

    const deviceVerificationToken =
      await this.tokens.signLoginDeviceChallengeToken(challenge);

    return {
      requiresDeviceVerification: true,
      deviceVerificationToken,
      otpChannel: dest.otpChannel,
    };
  }

  async verifyLoginDeviceOtp(dto: VerifyLoginDeviceOtpDto): Promise<LoginResult> {
    const challenge =
      await this.tokens.verifyLoginDeviceChallengeToken(
        dto.deviceVerificationToken,
      );

    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid or expired device verification');
    }

    await this.otpRequests.verifyOtpAndConsume(
      OtpPurpose.LOGIN_DEVICE,
      challenge.otpPhone ?? undefined,
      challenge.otpEmail ?? undefined,
      dto.otp,
    );

    const session = await this.openPasswordSession(
      user,
      {
        deviceId: challenge.deviceId,
        platform: challenge.platform,
        appVersion: challenge.appVersion,
        deviceName: challenge.deviceName ?? undefined,
      },
      { markTrusted: true },
    );

    return { requiresDeviceVerification: false, ...session };
  }

  private resolveLoginDeviceOtpDestination(user: User): {
    otpChannel: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
  } {
    const phone = user.phoneNumber?.trim();
    if (phone && phone.length > 0) {
      return { otpChannel: 'phone', phoneNumber: phone };
    }
    const email = user.email?.trim().toLowerCase();
    if (email && email.length > 0) {
      return { otpChannel: 'email', email };
    }
    throw new BadRequestException(
      'Add a phone number or email to your account to sign in from new devices',
    );
  }

  private async openPasswordSessionWithTx(
    tx: Prisma.TransactionClient,
    user: User,
    dto: Pick<LoginDto, 'deviceId' | 'platform' | 'appVersion' | 'deviceName'>,
    deviceOptions: { markTrusted?: boolean },
  ): Promise<{ deviceRow: UserDevice; refreshRaw: string }> {
    const refreshRaw = this.tokens.generateRefreshToken();
    const tokenHash = this.tokens.hashRefreshToken(refreshRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    const d: UserDevice = await this.devices.upsertForLogin(
      user.id,
      {
        deviceId: dto.deviceId,
        platform: dto.platform,
        appVersion: dto.appVersion,
        deviceName: dto.deviceName,
      },
      tx,
      deviceOptions.markTrusted ? { markTrusted: true } : undefined,
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
        userId: user.id,
        userDeviceId: d.id,
        tokenHash,
        expiresAt,
      },
    });

    return { deviceRow: d, refreshRaw };
  }

  private async openPasswordSession(
    user: User,
    dto: Pick<LoginDto, 'deviceId' | 'platform' | 'appVersion' | 'deviceName'>,
    deviceOptions: { markTrusted?: boolean },
  ): Promise<LoginSessionPayload> {
    const { deviceRow, refreshRaw } = await this.prisma.$transaction(
      async (tx) => this.openPasswordSessionWithTx(tx, user, dto, deviceOptions),
    );

    const accessToken = await this.tokens.signAccessToken(user.id, {
      deviceId: deviceRow.deviceId,
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      expiresIn: this.tokens.getAccessExpiresInSeconds(),
      user: toPublicUser(user),
      device: {
        id: deviceRow.id,
        deviceId: deviceRow.deviceId,
        platform: deviceRow.platform,
      },
    };
  }

  async qrCreate(dto: QrCreateDto): Promise<{
    sessionToken: string;
    expiresAt: Date;
  }> {
    const ttl = this.config.get('qr', { infer: true }).loginSessionTtlMinutes;
    const publicToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttl * 60_000);

    await this.prisma.qrLoginSession.create({
      data: {
        publicToken,
        status: QrLoginSessionStatus.pending,
        expiresAt,
        webDeviceId: dto.deviceId,
        webPlatform: 'web',
        webAppVersion: dto.appVersion,
        webDeviceName: dto.deviceName?.trim() ? dto.deviceName.trim() : null,
      },
    });

    return { sessionToken: publicToken, expiresAt };
  }

  async qrGetStatus(sessionToken: string): Promise<
    | {
        status: 'pending' | 'scanned' | 'rejected';
        expiresAt: Date;
      }
    | {
        status: 'expired' | 'not_found';
        expiresAt?: Date;
      }
    | {
        status: 'approved';
        expiresAt: Date;
        tokensAlreadyDelivered: true;
      }
    | ({
        status: 'approved';
        expiresAt: Date;
        tokensAlreadyDelivered: false;
      } & LoginSessionPayload)
  > {
    this.assertQrSessionTokenFormat(sessionToken);

    const row = await this.prisma.qrLoginSession.findUnique({
      where: { publicToken: sessionToken },
    });

    if (!row) {
      return { status: 'not_found' };
    }

    const now = new Date();

    if (
      row.expiresAt <= now &&
      (row.status === QrLoginSessionStatus.pending ||
        row.status === QrLoginSessionStatus.scanned)
    ) {
      await this.prisma.qrLoginSession.updateMany({
        where: {
          id: row.id,
          status: {
            in: [
              QrLoginSessionStatus.pending,
              QrLoginSessionStatus.scanned,
            ],
          },
        },
        data: { status: QrLoginSessionStatus.expired },
      });
      return { status: 'expired', expiresAt: row.expiresAt };
    }

    if (row.status === QrLoginSessionStatus.rejected) {
      return { status: 'rejected', expiresAt: row.expiresAt };
    }

    if (row.status === QrLoginSessionStatus.expired) {
      return { status: 'expired', expiresAt: row.expiresAt };
    }

    if (row.status === QrLoginSessionStatus.approved) {
      const delivered = await this.prisma.$transaction(async (tx) => {
        const r = await tx.qrLoginSession.findUnique({
          where: { id: row.id },
        });
        if (
          !r?.accessTokenForDelivery ||
          !r.refreshTokenForDelivery ||
          r.tokensDeliveredAt
        ) {
          return null;
        }
        const accessToken = r.accessTokenForDelivery;
        const refreshToken = r.refreshTokenForDelivery;
        await tx.qrLoginSession.update({
          where: { id: r.id },
          data: {
            accessTokenForDelivery: null,
            refreshTokenForDelivery: null,
            tokensDeliveredAt: new Date(),
          },
        });
        return { accessToken, refreshToken };
      });

      if (!delivered) {
        return {
          status: 'approved',
          expiresAt: row.expiresAt,
          tokensAlreadyDelivered: true,
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: row.approvedByUserId! },
      });
      if (!user) {
        return {
          status: 'approved',
          expiresAt: row.expiresAt,
          tokensAlreadyDelivered: true,
        };
      }

      const deviceRow = await this.prisma.userDevice.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: row.webDeviceId,
          },
        },
      });

      if (!deviceRow) {
        return {
          status: 'approved',
          expiresAt: row.expiresAt,
          tokensAlreadyDelivered: true,
        };
      }

      return {
        status: 'approved',
        expiresAt: row.expiresAt,
        tokensAlreadyDelivered: false,
        accessToken: delivered.accessToken,
        refreshToken: delivered.refreshToken,
        expiresIn: this.tokens.getAccessExpiresInSeconds(),
        user: toPublicUser(user),
        device: {
          id: deviceRow.id,
          deviceId: deviceRow.deviceId,
          platform: deviceRow.platform,
        },
      };
    }

    if (row.status === QrLoginSessionStatus.pending) {
      return { status: 'pending', expiresAt: row.expiresAt };
    }

    return { status: 'scanned', expiresAt: row.expiresAt };
  }

  async qrScan(actorUserId: string, sessionToken: string): Promise<{ ok: true }> {
    this.assertQrSessionTokenFormat(sessionToken);

    const row = await this.prisma.qrLoginSession.findUnique({
      where: { publicToken: sessionToken },
    });

    if (!row) {
      throw new NotFoundException('QR session not found');
    }

    const now = new Date();
    if (row.expiresAt <= now) {
      await this.prisma.qrLoginSession.updateMany({
        where: {
          id: row.id,
          status: {
            in: [
              QrLoginSessionStatus.pending,
              QrLoginSessionStatus.scanned,
            ],
          },
        },
        data: { status: QrLoginSessionStatus.expired },
      });
      throw new GoneException('QR session expired');
    }

    if (row.status === QrLoginSessionStatus.scanned) {
      if (row.scannedByUserId === actorUserId) {
        return { ok: true };
      }
      throw new ConflictException('This QR code was scanned by another account');
    }

    if (row.status !== QrLoginSessionStatus.pending) {
      throw new ConflictException('QR session is no longer available');
    }

    await this.prisma.qrLoginSession.update({
      where: { id: row.id },
      data: {
        status: QrLoginSessionStatus.scanned,
        scannedByUserId: actorUserId,
        scannedAt: now,
      },
    });

    return { ok: true };
  }

  async qrApprove(actorUserId: string, sessionToken: string): Promise<{ ok: true }> {
    this.assertQrSessionTokenFormat(sessionToken);

    await this.prisma.$transaction(async (tx) => {
      const row = await tx.qrLoginSession.findUnique({
        where: { publicToken: sessionToken },
      });

      if (!row) {
        throw new NotFoundException('QR session not found');
      }

      const now = new Date();
      if (row.expiresAt <= now) {
        await tx.qrLoginSession.updateMany({
          where: {
            id: row.id,
            status: {
              in: [
                QrLoginSessionStatus.pending,
                QrLoginSessionStatus.scanned,
              ],
            },
          },
          data: { status: QrLoginSessionStatus.expired },
        });
        throw new GoneException('QR session expired');
      }

      if (row.status !== QrLoginSessionStatus.scanned) {
        throw new BadRequestException(
          'Scan this QR code on your phone first, then approve',
        );
      }

      if (row.scannedByUserId !== actorUserId) {
        throw new ForbiddenException('Only the account that scanned can approve');
      }

      const user = await tx.user.findUnique({ where: { id: actorUserId } });
      if (!user?.isActive) {
        throw new UnauthorizedException('Account is disabled');
      }

      const { deviceRow, refreshRaw } = await this.openPasswordSessionWithTx(
        tx,
        user,
        {
          deviceId: row.webDeviceId,
          platform: row.webPlatform,
          appVersion: row.webAppVersion,
          deviceName: row.webDeviceName ?? undefined,
        },
        { markTrusted: true },
      );

      const accessToken = await this.tokens.signAccessToken(user.id, {
        deviceId: deviceRow.deviceId,
      });

      await tx.qrLoginSession.update({
        where: { id: row.id },
        data: {
          status: QrLoginSessionStatus.approved,
          approvedAt: now,
          approvedByUserId: actorUserId,
          accessTokenForDelivery: accessToken,
          refreshTokenForDelivery: refreshRaw,
        },
      });
    });

    return { ok: true };
  }

  async qrReject(actorUserId: string, sessionToken: string): Promise<{ ok: true }> {
    this.assertQrSessionTokenFormat(sessionToken);

    const row = await this.prisma.qrLoginSession.findUnique({
      where: { publicToken: sessionToken },
    });

    if (!row) {
      throw new NotFoundException('QR session not found');
    }

    const now = new Date();
    if (row.expiresAt <= now) {
      await this.prisma.qrLoginSession.updateMany({
        where: {
          id: row.id,
          status: {
            in: [
              QrLoginSessionStatus.pending,
              QrLoginSessionStatus.scanned,
            ],
          },
        },
        data: { status: QrLoginSessionStatus.expired },
      });
      throw new GoneException('QR session expired');
    }

    if (row.status !== QrLoginSessionStatus.scanned) {
      throw new BadRequestException('Nothing to reject for this QR session');
    }

    if (row.scannedByUserId !== actorUserId) {
      throw new ForbiddenException('Only the account that scanned can reject');
    }

    await this.prisma.qrLoginSession.update({
      where: { id: row.id },
      data: {
        status: QrLoginSessionStatus.rejected,
        rejectedAt: now,
      },
    });

    return { ok: true };
  }

  private assertQrSessionTokenFormat(sessionToken: string): void {
    if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
      throw new BadRequestException('Invalid session token format');
    }
  }

  async forgotPasswordRequestOtp(
    phoneNumber: string | undefined,
    email: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ message: string }> {
    let user: User | null = null;
    if (email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await this.prisma.user.findUnique({ where: { phoneNumber } });
    }

    if (!user || !user.passwordHash) {
      return {
        message:
          'If an account exists for this contact, a verification code was sent.',
      };
    }

    await this.otpRequests.startOtpRequest(
      OtpPurpose.FORGOT_PASSWORD,
      phoneNumber,
      email,
      ipAddress,
      userAgent,
    );

    return {
      message:
        'If an account exists for this contact, a verification code was sent.',
    };
  }

  async forgotPasswordVerifyOtp(
    dto: VerifyContactOtpDto,
  ): Promise<{ token: string }> {
    await this.otpRequests.verifyOtpAndConsume(
      OtpPurpose.FORGOT_PASSWORD,
      dto.phoneNumber,
      dto.email,
      dto.otp,
    );

    let user: User | null = null;
    if (dto.email) {
      user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    } else {
      user = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber! },
      });
    }

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Invalid request');
    }

    const proof: OtpProofPayload = {
      typ: 'otp_proof',
      purpose: 'forgot_password',
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    const token = await this.tokens.signOtpProofToken(proof);
    return { token };
  }

  async forgotPasswordReset(
    dto: ForgotPasswordResetDto,
  ): Promise<{ message: string }> {
    const proof = await this.tokens.verifyOtpProofToken(dto.token);
    if (proof.purpose !== 'forgot_password') {
      throw new BadRequestException('Invalid token for password reset');
    }

    const newHash = await bcrypt.hash(dto.newPassword, PASSWORD_BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id: proof.userId } });
      if (!u) {
        throw new BadRequestException('Invalid request');
      }

      await tx.user.update({
        where: { id: proof.userId },
        data: { passwordHash: newHash },
      });

      await tx.refreshToken.updateMany({
        where: { userId: proof.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: 'Password updated. Sign in again on all devices.' };
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
