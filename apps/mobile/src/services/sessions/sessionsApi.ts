import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";
import { apiClient } from "@/services/api/client";
import { getOrCreateDeviceId } from "@/services/device/deviceSession";

const MOCK_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Matches `UserSessionOpenApiDto` / serialized Prisma row + `isCurrent`. */
export type UserSession = {
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

type SessionsListResponse = { sessions: UserSession[] };

type MockSessionSeed = Omit<UserSession, "isCurrent">;

let mockSessionsStore: MockSessionSeed[] | null = null;

async function ensureMockSessions(): Promise<MockSessionSeed[]> {
  if (mockSessionsStore !== null) return mockSessionsStore;
  const myDeviceId = await getOrCreateDeviceId();
  const now = new Date().toISOString();
  mockSessionsStore = [
    {
      id: "a0000000-0000-4000-8000-000000000001",
      userId: "mock-user",
      deviceId: myDeviceId,
      platform: "android",
      appVersion: "1.0.0",
      deviceName: "Thiết bị này (mock)",
      isTrusted: true,
      lastSeenAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a0000000-0000-4000-8000-000000000002",
      userId: "mock-user",
      deviceId: "loza-mock-other-device",
      platform: "web",
      appVersion: "1.0.0",
      deviceName: "Trình duyệt Chrome",
      isTrusted: true,
      lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  return mockSessionsStore;
}

function withCurrentFlag(rows: MockSessionSeed[], currentDeviceId: string): UserSession[] {
  const trimmed = currentDeviceId.trim();
  return rows.map((d) => ({
    ...d,
    isCurrent: trimmed.length > 0 && d.deviceId === trimmed,
  }));
}

export async function fetchActiveSessions(): Promise<UserSession[]> {
  if (USE_API_MOCK) {
    await delay(MOCK_DELAY_MS);
    const rows = await ensureMockSessions();
    const myDeviceId = await getOrCreateDeviceId();
    return withCurrentFlag(rows, myDeviceId);
  }
  try {
    const { data } = await apiClient.get<SessionsListResponse>("/sessions");
    return data.sessions;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được danh sách phiên."));
  }
}

export async function revokeSessionRemote(sessionId: string): Promise<void> {
  if (USE_API_MOCK) {
    await delay(MOCK_DELAY_MS);
    const rows = await ensureMockSessions();
    const next = rows.filter((r) => r.id !== sessionId);
    mockSessionsStore = next;
    return;
  }
  try {
    await apiClient.delete(`/sessions/${sessionId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không thu hồi được phiên."));
  }
}

/**
 * POST /auth/logout-all — revokes all refresh tokens and deactivates devices.
 * Caller must clear local session afterward.
 */
export async function logoutAllDevicesRemote(): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    await delay(MOCK_DELAY_MS);
    mockSessionsStore = null;
    return { message: "Logged out from all devices" };
  }
  try {
    const { data } = await apiClient.post<{ message: string }>("/auth/logout-all", {});
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không đăng xuất hết thiết bị được."));
  }
}
