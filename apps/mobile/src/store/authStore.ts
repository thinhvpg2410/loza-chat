import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { USE_API_MOCK } from "@/constants/env";

const AUTH_STORAGE_KEY = "loza_auth_session";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
  username?: string;
  statusMessage?: string;
  /** YYYY-MM-DD */
  birthDate?: string | null;
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
  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  setOtpProofToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setResetToken: (token: string | null) => void;
  login: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

async function persistSession(snapshot: PersistedAuth) {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
}

async function readSession(): Promise<PersistedAuth | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  phone: "",
  otp: "",
  otpProofToken: null,
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  resetToken: null,

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

  login: async ({ accessToken, refreshToken, user }) => {
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
      otpProofToken: null,
    });
    await persistSession({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
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

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      otp: "",
      otpProofToken: null,
      resetToken: null,
    });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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
