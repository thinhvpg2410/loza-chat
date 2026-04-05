export interface AccessTokenPayload {
  sub: string;
  /** Client device id string (from UserDevice.deviceId), when the token was minted with device context */
  deviceId?: string;
}
