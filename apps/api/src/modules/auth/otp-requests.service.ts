import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OtpPurpose, type OtpPurposeValue } from '../../common/constants/otp-purpose';
import { normalizeEmail } from '../../common/utils/contact-identifiers';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthErrorMessage } from './auth-errors';

const BCRYPT_ROUNDS = 10;

export type OtpContact = {
  phoneNumber: string | null;
  email: string | null;
};

@Injectable()
export class OtpRequestsService {
  private readonly logger = new Logger(OtpRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private normalizeContact(
    phoneNumber: string | undefined,
    email: string | undefined,
  ): OtpContact {
    const hasPhone =
      phoneNumber !== undefined &&
      phoneNumber !== null &&
      phoneNumber.trim() !== '';
    const hasEmail =
      email !== undefined && email !== null && email.trim() !== '';
    if (hasPhone === hasEmail) {
      throw new HttpException(
        'Provide exactly one of phoneNumber or email',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (hasEmail) {
      return { phoneNumber: null, email: normalizeEmail(email!) };
    }
    const E164_PHONE = /^\+[1-9]\d{6,14}$/;
    const p = phoneNumber!.trim();
    if (!E164_PHONE.test(p)) {
      throw new HttpException(
        'phoneNumber must be E.164 format (e.g. +84901234567)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { phoneNumber: p, email: null };
  }

  async startOtpRequest(
    purpose: OtpPurposeValue,
    phoneNumber: string | undefined,
    email: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<void> {
    const contact = this.normalizeContact(phoneNumber, email);

    const rateWindowMinutes =
      this.config.get<number>('otp.rateWindowMinutes') ?? 15;
    const maxRequests =
      this.config.get<number>('otp.maxRequestsPerPhoneWindow') ?? 5;
    const expiresMinutes = this.config.get<number>('otp.expiresMinutes') ?? 2;
    const maxResends =
      this.config.get<number>('otp.maxResendsPerActiveCode') ?? 3;
    const resendCooldownSeconds =
      this.config.get<number>('otp.resendCooldownSeconds') ?? 60;

    const windowStart = new Date(Date.now() - rateWindowMinutes * 60 * 1000);
    const recentWhere =
      contact.email !== null
        ? { email: contact.email }
        : { phoneNumber: contact.phoneNumber! };

    const recentCount = await this.prisma.otpRequest.count({
      where: {
        ...recentWhere,
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= maxRequests) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date();
    const active = await this.prisma.otpRequest.findFirst({
      where: {
        purpose,
        ...recentWhere,
        verifiedAt: null,
        expiredAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plainOtp = this.generateSixDigitOtp();
    const otpCodeHash = await bcrypt.hash(plainOtp, BCRYPT_ROUNDS);
    const expiredAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    if (active) {
      const sinceLastSendMs = Date.now() - active.lastSentAt.getTime();
      if (sinceLastSendMs < resendCooldownSeconds * 1000) {
        throw new HttpException(
          'Please wait before requesting another verification code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (active.resendCount >= maxResends) {
        throw new HttpException(
          'Too many resend attempts for this verification. Request a new code later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      await this.prisma.otpRequest.update({
        where: { id: active.id },
        data: {
          otpCodeHash,
          expiredAt,
          resendCount: { increment: 1 },
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          attempts: 0,
          lastSentAt: new Date(),
        },
      });
    } else {
      await this.prisma.otpRequest.create({
        data: {
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          otpCodeHash,
          purpose,
          expiredAt,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });
    }

    const nodeEnv = this.config.get<string>('nodeEnv', 'development');
    const dest =
      contact.email !== null ? contact.email : contact.phoneNumber ?? '';
    if (nodeEnv === 'development') {
      this.logger.log(`[DEV ONLY] OTP for ${purpose} ${dest}: ${plainOtp}`);
    }
  }

  async verifyOtpAndConsume(
    purpose: OtpPurposeValue,
    phoneNumber: string | undefined,
    email: string | undefined,
    plainOtp: string,
  ): Promise<OtpContact> {
    const contact = this.normalizeContact(phoneNumber, email);
    const maxAttempts = this.config.get<number>('otp.maxVerifyAttempts') ?? 5;
    const now = new Date();

    const row = await this.prisma.otpRequest.findFirst({
      where: {
        purpose,
        ...(contact.email !== null
          ? { email: contact.email, phoneNumber: null }
          : { phoneNumber: contact.phoneNumber!, email: null }),
        verifiedAt: null,
        expiredAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) {
      throw new UnauthorizedException(
        AuthErrorMessage.INVALID_OR_EXPIRED_VERIFICATION,
      );
    }

    if (row.attempts >= maxAttempts) {
      throw new UnauthorizedException(
        AuthErrorMessage.TOO_MANY_VERIFICATION_ATTEMPTS,
      );
    }

    const match = await bcrypt.compare(plainOtp, row.otpCodeHash);
    if (!match) {
      await this.prisma.otpRequest.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException(
        AuthErrorMessage.INVALID_OR_EXPIRED_VERIFICATION,
      );
    }

    await this.prisma.otpRequest.update({
      where: { id: row.id },
      data: { verifiedAt: new Date() },
    });

    return {
      phoneNumber: contact.phoneNumber,
      email: contact.email,
    };
  }

  private generateSixDigitOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
