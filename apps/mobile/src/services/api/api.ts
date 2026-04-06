import { isAxiosError } from "axios";

import { USE_API_MOCK } from "@/constants/env";
import { getDeviceSessionPayload } from "@/services/device/deviceSession";
import { mapPublicUserToAuthUser } from "@/services/api/mapPublicUser";
import type { AuthUser } from "@/store/authStore";

import { apiClient } from "./client";

const MOCK_DELAY_MS = 650;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getApiErrorMessage(err: unknown, fallback = "Có lỗi xảy ra"): string {
  if (isAxiosError(err)) {
    if (err.response == null && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
      return "Không kết nối được máy chủ. Kiểm tra API đang chạy và điện thoại cùng Wi‑Fi với máy dev (tránh dùng localhost trên điện thoại thật).";
    }
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (typeof m === "string") return m;
    if (Array.isArray(m) && m[0]) return String(m[0]);
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

const E164 = /^\+[1-9]\d{6,14}$/;

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

type PublicUserDto = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
};

function mapSession(data: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUserDto;
}): AuthSessionResponse {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    user: mapPublicUserToAuthUser(data.user),
  };
}

// ——— Mocks (aligned with backend shapes) ———

async function mockDelay() {
  await delay(MOCK_DELAY_MS);
}

async function mockRegisterRequestOtp(phoneNumber: string) {
  await mockDelay();
  if (!E164.test(phoneNumber)) {
    throw { response: { data: { message: "Số điện thoại không hợp lệ (E.164)" }, status: 400 } };
  }
  if (phoneNumber.endsWith("0")) {
    throw { response: { data: { message: "Phone number already registered" }, status: 409 } };
  }
  return { message: "Verification code sent" as const };
}

async function mockRegisterVerifyOtp(payload: { phoneNumber: string; otp: string }) {
  await mockDelay();
  if (payload.otp === "000000") {
    throw { response: { data: { message: "Mã OTP không đúng" }, status: 400 } };
  }
  if (payload.otp !== "123456") {
    throw { response: { data: { message: "Mã OTP không đúng" }, status: 400 } };
  }
  return { token: "mock-register-otp-proof-token" };
}

async function mockCreateAccount(payload: {
  token: string;
  password: string;
  displayName?: string;
}) {
  await mockDelay();
  if (!payload.token || payload.password.length < 8) {
    throw { response: { data: { message: "Dữ liệu không hợp lệ" }, status: 400 } };
  }
  const name = payload.displayName?.trim() || "Người dùng";
  return mapSession({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 900,
    user: {
      id: "mock-user-1",
      displayName: name,
      phoneNumber: "+84900000000",
      avatarUrl: null,
    },
  });
}

async function mockLogin(payload: { identifier: string; password: string }) {
  await mockDelay();
  if (payload.password.length < 8) {
    throw { response: { data: { message: "Invalid credentials" }, status: 401 } };
  }
  const phone = payload.identifier.trim().startsWith("+")
    ? payload.identifier.trim()
    : `+${payload.identifier.trim()}`;
  return mapSession({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresIn: 900,
    user: {
      id: `user-${phone}`,
      displayName: "Người dùng",
      phoneNumber: phone,
      avatarUrl: null,
    },
  });
}

async function mockForgotPasswordRequestOtp(phoneNumber: string) {
  await mockDelay();
  if (!E164.test(phoneNumber)) {
    throw { response: { data: { message: "Số điện thoại không hợp lệ" }, status: 400 } };
  }
  return { message: "If an account exists for this contact, a verification code was sent." as const };
}

async function mockForgotPasswordVerifyOtp(payload: { phoneNumber: string; otp: string }) {
  await mockDelay();
  if (payload.otp !== "123456") {
    throw { response: { data: { message: "Mã OTP không đúng" }, status: 400 } };
  }
  return { token: "mock-forgot-proof-token" };
}

async function mockForgotPasswordReset(payload: { token: string; newPassword: string }) {
  await mockDelay();
  if (!payload.token || payload.newPassword.length < 8) {
    throw { response: { data: { message: "Không thể đặt lại mật khẩu" }, status: 400 } };
  }
  return { message: "Password updated. Sign in again on all devices." as const };
}

// ——— API ———

export async function registerRequestOtp(phoneNumber: string): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    return mockRegisterRequestOtp(phoneNumber);
  }
  const { data } = await apiClient.post<{ message: string }>("/auth/register/request-otp", {
    phoneNumber,
  });
  return data;
}

export async function registerVerifyOtp(payload: {
  phoneNumber: string;
  otp: string;
}): Promise<{ token: string }> {
  if (USE_API_MOCK) {
    return mockRegisterVerifyOtp(payload);
  }
  const { data } = await apiClient.post<{ token: string }>("/auth/register/verify-otp", {
    phoneNumber: payload.phoneNumber,
    otp: payload.otp,
  });
  return data;
}

export async function createAccount(payload: {
  token: string;
  password: string;
  displayName?: string;
}): Promise<AuthSessionResponse> {
  if (USE_API_MOCK) {
    return mockCreateAccount(payload);
  }
  const device = await getDeviceSessionPayload();
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUserDto;
  }>("/auth/register/create-account", {
    token: payload.token,
    password: payload.password,
    displayName: payload.displayName,
    ...device,
  });
  return mapSession(data);
}

export async function login(payload: {
  identifier: string;
  password: string;
}): Promise<AuthSessionResponse> {
  if (USE_API_MOCK) {
    return mockLogin(payload);
  }
  const device = await getDeviceSessionPayload();
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: PublicUserDto;
  }>("/auth/login", {
    identifier: payload.identifier.trim(),
    password: payload.password,
    ...device,
  });
  return mapSession(data);
}

export async function forgotPasswordRequestOtp(phoneNumber: string): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    return mockForgotPasswordRequestOtp(phoneNumber);
  }
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password/request-otp", {
    phoneNumber,
  });
  return data;
}

export async function forgotPasswordVerifyOtp(payload: {
  phoneNumber: string;
  otp: string;
}): Promise<{ token: string }> {
  if (USE_API_MOCK) {
    return mockForgotPasswordVerifyOtp(payload);
  }
  const { data } = await apiClient.post<{ token: string }>("/auth/forgot-password/verify-otp", {
    phoneNumber: payload.phoneNumber,
    otp: payload.otp,
  });
  return data;
}

export async function forgotPasswordReset(payload: {
  token: string;
  newPassword: string;
}): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    return mockForgotPasswordReset(payload);
  }
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password/reset", {
    token: payload.token,
    newPassword: payload.newPassword,
  });
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (USE_API_MOCK) {
    await mockDelay();
    return {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 900,
    };
  }
  const { data } = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>("/auth/refresh", { refreshToken });
  return data;
}

export async function logoutRequest(refreshToken: string): Promise<{ message: string }> {
  if (USE_API_MOCK) {
    await mockDelay();
    return { message: "Logged out" };
  }
  const { data } = await apiClient.post<{ message: string }>("/auth/logout", { refreshToken });
  return data;
}
