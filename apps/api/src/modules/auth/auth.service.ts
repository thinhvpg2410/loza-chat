import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User, UserDevice } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from '../../common/constants/otp-purpose';
import { parseLoginIdentifier } from '../../common/utils/contact-identifiers';
import { toPublicUser } from '../../common/utils/user-public';
import type { PublicUser } from '../../common/utils/user-public';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import type { CreateAccountDto } from './dto/create-account.dto';
import type { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import type { LoginDto } from './dto/login.dto';
import type { VerifyContactOtpDto } from './dto/contact-otp.dto';
import type { OtpProofPayload } from './interfaces/otp-proof-payload.interface';
import { OtpRequestsService } from './otp-requests.service';
import { TokenService } from './token.service';

const PASSWORD_BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpRequests: OtpRequestsService,
    private readonly tokens: TokenService,
    private readonly devices: DevicesService,
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

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUser;
    device: { id: string; deviceId: string; platform: string };
  }> {
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

    const refreshRaw = this.tokens.generateRefreshToken();
    const tokenHash = this.tokens.hashRefreshToken(refreshRaw);
    const expiresAt = this.tokens.getRefreshExpiresAt();

    const { deviceRow } = await this.prisma.$transaction(async (tx) => {
      const d: UserDevice = await this.devices.upsertForLogin(
        user.id,
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
          userId: user.id,
          userDeviceId: d.id,
          tokenHash,
          expiresAt,
        },
      });

      return { deviceRow: d };
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
