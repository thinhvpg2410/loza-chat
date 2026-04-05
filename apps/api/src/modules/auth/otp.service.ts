import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../redis/redis.service';

const OTP_KEY_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redis: RedisService) {}

  private redisKey(phone: string): string {
    return `${OTP_KEY_PREFIX}${phone}`;
  }

  async createAndStoreOtp(phone: string): Promise<string> {
    const code = this.generateSixDigitOtp();
    const hashed = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const client = this.redis.getClient();
    await client.set(this.redisKey(phone), hashed, 'EX', OTP_TTL_SECONDS);
    this.logger.log(`[mock SMS] OTP for ${phone}: ${code}`);
    return code;
  }

  async verifyAndConsumeOtp(phone: string, plainOtp: string): Promise<boolean> {
    const client = this.redis.getClient();
    const key = this.redisKey(phone);
    const stored = await client.get(key);
    if (!stored) {
      return false;
    }
    const match = await bcrypt.compare(plainOtp, stored);
    if (match) {
      await client.del(key);
    }
    return match;
  }

  private generateSixDigitOtp(): string {
    const n = Math.floor(100000 + Math.random() * 900000);
    return String(n);
  }
}
