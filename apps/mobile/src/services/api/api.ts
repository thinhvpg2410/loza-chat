import type { AuthUser } from "@/store/authStore";
import { apiClient } from "@/services/api/client";

const MOCK_DELAY_MS = 650;
const MOCK_ENABLED = process.env.EXPO_PUBLIC_USE_API_MOCK !== "false";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type VerifyOtpResult = {
  isNewUser: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  resetToken: string | null;
};

/** Demo: OTP hợp lệ là 123456; 000000 luôn sai. Số điện thoại kết thúc bằng 9 = user mới. */
async function mockSendOtp(phone: string) {
  await delay(MOCK_DELAY_MS);
  if (!/^\d{10}$/.test(phone)) {
    throw { response: { data: { message: "Số điện thoại không hợp lệ" }, status: 400 } };
  }
  return { success: true as const };
}

async function mockVerifyOtp(payload: {
  phone: string;
  otp: string;
  purpose: "login" | "forgot";
}): Promise<VerifyOtpResult> {
  await delay(MOCK_DELAY_MS);
  if (payload.otp === "000000") {
    throw { response: { data: { message: "Mã OTP không đúng" }, status: 400 } };
  }
  if (!/^\d{6}$/.test(payload.otp)) {
    throw { response: { data: { message: "Mã OTP không hợp lệ" }, status: 400 } };
  }
  if (payload.purpose === "forgot") {
    return {
      resetToken: `mock-reset-${payload.phone}`,
      accessToken: null as string | null,
      user: null as null,
      isNewUser: false,
    };
  }
  const isNewUser = payload.phone.endsWith("9");
  if (isNewUser) {
    return {
      isNewUser: true as const,
      accessToken: null as string | null,
      user: null as null,
      resetToken: null as null,
    };
  }
  return {
    isNewUser: false as const,
    accessToken: "mock-access-token",
    user: {
      id: `user-${payload.phone}`,
      name: "Người dùng",
      phone: payload.phone,
    },
    resetToken: null as null,
  };
}

async function mockRegister(payload: {
  phone: string;
  name: string;
  avatarUri?: string;
}) {
  await delay(MOCK_DELAY_MS);
  if (!payload.name?.trim()) {
    throw { response: { data: { message: "Tên không hợp lệ" }, status: 400 } };
  }
  return {
    accessToken: "mock-access-token",
    user: {
      id: `user-${payload.phone}`,
      name: payload.name.trim(),
      phone: payload.phone,
      avatarUri: payload.avatarUri,
    },
  };
}

async function mockForgotPassword(phone: string) {
  await delay(MOCK_DELAY_MS);
  if (!/^\d{10}$/.test(phone)) {
    throw { response: { data: { message: "Số điện thoại không hợp lệ" }, status: 400 } };
  }
  return { success: true as const };
}

async function mockResetPassword(payload: { resetToken: string; password: string }) {
  await delay(MOCK_DELAY_MS);
  if (!payload.resetToken || payload.password.length < 6) {
    throw { response: { data: { message: "Không thể đặt lại mật khẩu" }, status: 400 } };
  }
  return { success: true as const };
}

export async function sendOtp(phone: string) {
  if (MOCK_ENABLED) {
    return mockSendOtp(phone);
  }
  const { data } = await apiClient.post<{ success: boolean }>("/auth/send-otp", { phone });
  return data;
}

export async function verifyOtp(payload: {
  phone: string;
  otp: string;
  purpose: "login" | "forgot";
}): Promise<VerifyOtpResult> {
  if (MOCK_ENABLED) {
    return mockVerifyOtp(payload);
  }
  const { data } = await apiClient.post<VerifyOtpResult>("/auth/verify-otp", payload);
  return data;
}

export async function register(payload: {
  phone: string;
  name: string;
  avatarUri?: string;
}) {
  if (MOCK_ENABLED) {
    return mockRegister(payload);
  }
  const { data } = await apiClient.post<{
    accessToken: string;
    user: { id: string; name: string; phone: string; avatarUri?: string };
  }>("/auth/register", payload);
  return data;
}

export async function forgotPassword(phone: string) {
  if (MOCK_ENABLED) {
    return mockForgotPassword(phone);
  }
  const { data } = await apiClient.post<{ success: boolean }>("/auth/forgot-password", {
    phone,
  });
  return data;
}

export async function resetPassword(payload: { resetToken: string; password: string }) {
  if (MOCK_ENABLED) {
    return mockResetPassword(payload);
  }
  const { data } = await apiClient.post<{ success: boolean }>("/auth/reset-password", payload);
  return data;
}
