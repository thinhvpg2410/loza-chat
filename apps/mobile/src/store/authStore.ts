import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const AUTH_STORAGE_KEY = "loza_auth_session";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
};

type PersistedAuth = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

type AuthState = {
  phone: string;
  otp: string;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  resetToken: string | null;
  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  setUser: (user: AuthUser | null) => void;
  setResetToken: (token: string | null) => void;
  login: (payload: { accessToken: string; user: AuthUser }) => Promise<void>;
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
  user: null,
  accessToken: null,
  isAuthenticated: false,
  resetToken: null,

  setPhone: (phone) => set({ phone }),
  setOtp: (otp) => set({ otp }),
  setUser: (user) => set({ user }),
  setResetToken: (resetToken) => set({ resetToken }),

  login: async ({ accessToken, user }) => {
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
    await persistSession({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      otp: "",
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
      user: session.user,
      isAuthenticated: true,
    });
  },
}));

export function getAuthState() {
  return useAuthStore.getState();
}
