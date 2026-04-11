export const OtpPurpose = {
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  LOGIN_DEVICE: 'login_device',
} as const;

export type OtpPurposeValue = (typeof OtpPurpose)[keyof typeof OtpPurpose];
