import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from '../../common/constants/otp-purpose';
import { PrismaService } from '../../prisma/prisma.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpRequestsService {
  private readonly logger = new Logger(OtpRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async startOtpRequest(
    phoneNumber: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<void> {
    const rateWindowMinutes =
      this.config.get<number>('otp.rateWindowMinutes') ?? 15;
    const maxRequests =
      this.config.get<number>('otp.maxRequestsPerPhoneWindow') ?? 5;
    const expiresMinutes = this.config.get<number>('otp.expiresMinutes') ?? 2;
    const maxResends =
      this.config.get<number>('otp.maxResendsPerActiveCode') ?? 3;

    const windowStart = new Date(Date.now() - rateWindowMinutes * 60 * 1000);
    const recentCount = await this.prisma.otpRequest.count({
      where: {
        phoneNumber,
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
        phoneNumber,
        purpose: OtpPurpose.LOGIN,
        verifiedAt: null,
        expiredAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plainOtp = this.generateSixDigitOtp();
    const otpCodeHash = await bcrypt.hash(plainOtp, BCRYPT_ROUNDS);
    const expiredAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    if (active) {
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
        },
      });
    } else {
      await this.prisma.otpRequest.create({
        data: {
          phoneNumber,
          otpCodeHash,
          purpose: OtpPurpose.LOGIN,
          expiredAt,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });
    }

    const nodeEnv = this.config.get<string>('nodeEnv', 'development');
    if (nodeEnv === 'development') {
      this.logger.log(`[DEV ONLY] OTP for ${phoneNumber}: ${plainOtp}`);
    }
  }

  async verifyOtpAndConsume(
    phoneNumber: string,
    plainOtp: string,
  ): Promise<void> {
    const maxAttempts = this.config.get<number>('otp.maxVerifyAttempts') ?? 5;
    const now = new Date();
    const row = await this.prisma.otpRequest.findFirst({
      where: {
        phoneNumber,
        purpose: OtpPurpose.LOGIN,
        verifiedAt: null,
        expiredAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!row) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (row.attempts >= maxAttempts) {
      throw new UnauthorizedException(
        'Too many failed attempts. Request a new code.',
      );
    }

    const match = await bcrypt.compare(plainOtp, row.otpCodeHash);
    if (!match) {
      await this.prisma.otpRequest.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.otpRequest.update({
      where: { id: row.id },
      data: { verifiedAt: new Date() },
    });
  }

  private generateSixDigitOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
