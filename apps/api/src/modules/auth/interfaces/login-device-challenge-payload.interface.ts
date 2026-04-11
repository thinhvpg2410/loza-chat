export type LoginDeviceChallengePayload = {
  typ: 'login_device_challenge';
  userId: string;
  deviceId: string;
  platform: string;
  appVersion: string;
  deviceName: string | null;
  otpChannel: 'phone' | 'email';
  otpPhone: string | null;
  otpEmail: string | null;
};
