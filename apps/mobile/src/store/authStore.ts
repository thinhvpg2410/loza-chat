import { appStorage } from "@/storage/appStorage";
import { create } from "zustand";

import { USE_API_MOCK } from "@/constants/env";

const AUTH_STORAGE_KEY = "loza_auth_session";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUri?: string;
  username?: string;
  statusMessage?: string;
  /** YYYY-MM-DD */
  birthDate?: string | null;
};

/** Thiết bị mới: lưu tạm để gọi lại login khi gửi lại OTP (chỉ RAM, không persist). */
export type DeviceLoginChallenge = {
  deviceVerificationToken: string;
  otpChannel: "phone" | "email";
  identifier: string;
  password: string;
};

type PersistedAuth = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

type AuthState = {
  phone: string;
  otp: string;
  otpProofToken: string | null;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  resetToken: string | null;
  deviceLoginChallenge: DeviceLoginChallenge | null;
  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  setOtpProofToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setResetToken: (token: string | null) => void;
  setDeviceLoginChallenge: (challenge: DeviceLoginChallenge | null) => void;
  login: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => Promise<void>;
  /** Cập nhật cặp token sau /auth/refresh (giữ user hiện tại, ghi lại storage). */
  applyTokenRefresh: (payload: { accessToken: string; refreshToken: string }) => Promise<void>;
  /** Gọi GET /users/me và cập nhật user trong store (đồng bộ web ↔ mobile). */
  syncProfileFromServer: () => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

async function persistSession(snapshot: PersistedAuth) {
  await appStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
}

async function readSession(): Promise<PersistedAuth | null> {
  const raw = await appStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    return null;
  }
}

let lastProfileSyncAtMs = 0;
const PROFILE_SYNC_MIN_INTERVAL_MS = 4000;

export const useAuthStore = create<AuthState>((set, get) => ({
  phone: "",
  otp: "",
  otpProofToken: null,
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  resetToken: null,
  deviceLoginChallenge: null,

  setPhone: (phone) => set({ phone }),
  setOtp: (otp) => set({ otp }),
  setOtpProofToken: (otpProofToken) => set({ otpProofToken }),
  setUser: (user) => {
    set({ user });
    const snap = get();
    if (snap.isAuthenticated && snap.accessToken && user) {
      void persistSession({
        accessToken: snap.accessToken,
        refreshToken: snap.refreshToken,
        user,
        isAuthenticated: true,
      });
    }
  },
  setResetToken: (resetToken) => set({ resetToken }),
  setDeviceLoginChallenge: (deviceLoginChallenge) => set({ deviceLoginChallenge }),

  login: async ({ accessToken, refreshToken, user }) => {
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
      otpProofToken: null,
      deviceLoginChallenge: null,
    });
    await persistSession({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  applyTokenRefresh: async ({ accessToken, refreshToken }) => {
    const user = get().user;
    if (!user) return;
    set({ accessToken, refreshToken });
    await persistSession({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  syncProfileFromServer: async () => {
    if (USE_API_MOCK) return;
    const { isAuthenticated, accessToken } = get();
    if (!isAuthenticated || !accessToken) return;
    const now = Date.now();
    if (now - lastProfileSyncAtMs < PROFILE_SYNC_MIN_INTERVAL_MS) return;
    lastProfileSyncAtMs = now;
    try {
      const { fetchCurrentProfile } = await import("@/services/profile/profileApi");
      const u = await fetchCurrentProfile();
      get().setUser(u);
    } catch {
      // Transient network / auth errors: keep cached user.
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    if (refreshToken && !USE_API_MOCK) {
      try {
        const { logoutRequest } = await import("@/services/api/api");
        await logoutRequest(refreshToken);
      } catch {
        // Best-effort revoke; always clear local session.
      }
    }

    const { useChatStore } = await import("@/store/chatStore");
    useChatStore.getState().reset();

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      otp: "",
      otpProofToken: null,
      resetToken: null,
      deviceLoginChallenge: null,
    });
    await appStorage.removeItem(AUTH_STORAGE_KEY);
  },

  hydrate: async () => {
    const session = await readSession();
    if (!session?.isAuthenticated || !session.accessToken || !session.user) {
      return;
    }
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
      user: session.user,
      isAuthenticated: true,
    });
  },
}));

export function getAuthState() {
  return useAuthStore.getState();
}
