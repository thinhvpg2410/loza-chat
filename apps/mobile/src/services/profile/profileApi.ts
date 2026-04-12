import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";
import { mapPublicUserToAuthUser } from "@/services/api/mapPublicUser";
import { apiClient } from "@/services/api/client";
import type { AuthUser } from "@/store/authStore";
import { getAuthState } from "@/store/authStore";

type MeResponse = {
  user: {
    id: string;
    displayName: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    username?: string | null;
    statusMessage?: string | null;
    birthDate?: string | null;
  };
};

export async function fetchCurrentProfile(): Promise<AuthUser> {
  if (USE_API_MOCK) {
    const u = getAuthState().user;
    if (!u) throw new Error("Chưa đăng nhập");
    return u;
  }
  const { data } = await apiClient.get<MeResponse>("/users/me");
  return mapPublicUserToAuthUser(data.user);
}

export type UpdateProfilePayload = {
  displayName?: string;
  username?: string | null;
  statusMessage?: string | null;
  birthDate?: string | null;
};

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (USE_API_MOCK) {
    return true;
  }
  try {
    const { data } = await apiClient.get<{ available: boolean }>("/users/username-available", {
      params: { username: username.trim().toLowerCase() },
    });
    return data.available;
  } catch {
    return true;
  }
}

export async function updateProfileRemote(payload: UpdateProfilePayload): Promise<AuthUser> {
  if (USE_API_MOCK) {
    const u = getAuthState().user;
    if (!u) throw new Error("Chưa đăng nhập");
    const next: AuthUser = {
      ...u,
      ...(payload.displayName !== undefined ? { name: payload.displayName } : {}),
      ...(payload.username !== undefined
        ? { username: payload.username ?? undefined }
        : {}),
      ...(payload.statusMessage !== undefined
        ? { statusMessage: payload.statusMessage ?? undefined }
        : {}),
      ...(payload.birthDate !== undefined ? { birthDate: payload.birthDate } : {}),
    };
    return next;
  }
  try {
    const { data } = await apiClient.patch<MeResponse>("/users/me", payload);
    return mapPublicUserToAuthUser(data.user);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không cập nhật được hồ sơ."));
  }
}

const MOCK_DELAY_MS = 650;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /users/change-password — revokes refresh tokens and untrusts devices on the server.
 * Caller should log out locally and send the user to sign-in again.
 */
export async function changePasswordRemote(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    await delay(MOCK_DELAY_MS);
    if (!payload.currentPassword.trim()) {
      throw new Error("Nhập mật khẩu hiện tại.");
    }
    if (payload.newPassword.length < 8) {
      throw new Error("Mật khẩu mới quá ngắn.");
    }
    return { message: "Password updated" };
  }
  try {
    const { data } = await apiClient.post<{ message: string }>("/users/change-password", {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không đổi được mật khẩu."));
  }
}
