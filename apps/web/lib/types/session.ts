/** Active login session row from GET /sessions (UserDevice + isCurrent). */
export type WebUserSession = {
  id: string;
  userId: string;
  deviceId: string;
  platform: string;
  appVersion: string;
  deviceName: string | null;
  isTrusted: boolean;
  lastSeenAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
};
