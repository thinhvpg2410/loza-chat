export const OtpPurpose = {
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
} as const;

export type OtpPurposeValue = (typeof OtpPurpose)[keyof typeof OtpPurpose];
