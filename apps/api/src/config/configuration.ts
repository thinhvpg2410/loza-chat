export type AppConfiguration = {
  nodeEnv: string;
  port: number;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresDays: number;
  };
  otp: {
    expiresMinutes: number;
    maxVerifyAttempts: number;
    maxRequestsPerPhoneWindow: number;
    rateWindowMinutes: number;
    maxResendsPerActiveCode: number;
  };
  storage: {
    mock: boolean;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string | undefined;
    /** Optional public origin for CDN/R2 public bucket reads (no presigned GET in Phase 6). */
    publicBaseUrl: string | undefined;
  };
  upload: {
    sessionExpiresMinutes: number;
    presignExpiresSeconds: number;
    maxImageBytes: number;
    maxFileBytes: number;
    maxVoiceBytes: number;
    maxVideoBytes: number;
    maxOtherBytes: number;
    maxAttachmentsPerMessage: number;
  };
};

export default (): AppConfiguration => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresDays: parseInt(
      process.env.JWT_REFRESH_EXPIRES_DAYS ?? '30',
      10,
    ),
  },
  otp: {
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES ?? '2', 10),
    maxVerifyAttempts: parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS ?? '5', 10),
    maxRequestsPerPhoneWindow: parseInt(
      process.env.OTP_MAX_REQUESTS_PER_PHONE_WINDOW ?? '5',
      10,
    ),
    rateWindowMinutes: parseInt(
      process.env.OTP_RATE_WINDOW_MINUTES ?? '15',
      10,
    ),
    maxResendsPerActiveCode: parseInt(
      process.env.OTP_MAX_RESENDS_PER_ACTIVE_CODE ?? '3',
      10,
    ),
  },
  storage: {
    mock: process.env.STORAGE_MOCK === 'true',
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? 'auto',
    bucket: process.env.S3_BUCKET ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    endpoint: process.env.S3_ENDPOINT || undefined,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || undefined,
  },
  upload: {
    sessionExpiresMinutes: parseInt(
      process.env.UPLOAD_SESSION_EXPIRES_MINUTES ?? '15',
      10,
    ),
    presignExpiresSeconds: parseInt(
      process.env.UPLOAD_PRESIGN_EXPIRES_SECONDS ?? '600',
      10,
    ),
    maxImageBytes: parseInt(
      process.env.UPLOAD_MAX_IMAGE_BYTES ?? String(15 * 1024 * 1024),
      10,
    ),
    maxFileBytes: parseInt(
      process.env.UPLOAD_MAX_FILE_BYTES ?? String(50 * 1024 * 1024),
      10,
    ),
    maxVoiceBytes: parseInt(
      process.env.UPLOAD_MAX_VOICE_BYTES ?? String(20 * 1024 * 1024),
      10,
    ),
    maxVideoBytes: parseInt(
      process.env.UPLOAD_MAX_VIDEO_BYTES ?? String(100 * 1024 * 1024),
      10,
    ),
    maxOtherBytes: parseInt(
      process.env.UPLOAD_MAX_OTHER_BYTES ?? String(50 * 1024 * 1024),
      10,
    ),
    maxAttachmentsPerMessage: parseInt(
      process.env.UPLOAD_MAX_ATTACHMENTS_PER_MESSAGE ?? '10',
      10,
    ),
  },
});
