/** Stable client-facing messages for auth and OTP flows. */
export const AuthErrorMessage = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_OR_EXPIRED_SESSION: 'Invalid or expired session',
  INVALID_OR_EXPIRED_VERIFICATION: 'Invalid or expired verification code',
  TOO_MANY_VERIFICATION_ATTEMPTS:
    'Too many failed attempts. Request a new verification code.',
  ACCOUNT_DISABLED: 'Account is disabled',
  INVALID_TOKEN_FOR_STEP: 'Invalid or expired session token',
  DEVICE_VERIFICATION_EXPIRED: 'Invalid or expired device verification',
  INVALID_ACCOUNT_CREATION_TOKEN: 'Invalid token for account creation',
  INVALID_PASSWORD_RESET_TOKEN: 'Invalid token for password reset',
} as const;
