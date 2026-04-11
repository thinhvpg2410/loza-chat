"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetchPublicJson } from "@/lib/api/server";
import { contactToApiPayload } from "@/lib/contact/contactToApiPayload";
import { LOZA_REGISTER_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getOrCreateDeviceId } from "@/lib/auth/device";
import { setAuthCookies } from "@/lib/auth/set-auth-cookies";

const TRANSIENT_MAX_AGE = 60 * 15;

export type RegisterStepState = {
  error: string | null;
  ok?: boolean;
};

export async function requestRegisterOtpAction(
  _prev: RegisterStepState,
  formData: FormData,
): Promise<RegisterStepState> {
  const contact = String(formData.get("contact") ?? "").trim();
  const payload = contactToApiPayload(contact);
  if (!payload) {
    return { error: "Vui lòng nhập email hợp lệ hoặc số điện thoại (VD: 0901234567 hoặc +84901234567)." };
  }
  try {
    await apiFetchPublicJson<{ message: string }>("/auth/register/request-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không gửi được mã OTP." };
  }
  return { error: null, ok: true };
}

export async function verifyRegisterOtpAction(
  _prev: RegisterStepState,
  formData: FormData,
): Promise<RegisterStepState> {
  const contact = String(formData.get("contact") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();
  const payload = contactToApiPayload(contact);
  if (!payload) {
    return { error: "Email hoặc số điện thoại không hợp lệ." };
  }
  if (!/^\d{6}$/.test(otp)) {
    return { error: "Mã OTP phải gồm 6 chữ số." };
  }
  let token: string;
  try {
    const res = await apiFetchPublicJson<{ token: string }>("/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({ ...payload, otp }),
    });
    token = res.token;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Mã OTP không đúng hoặc đã hết hạn." };
  }
  const jar = await cookies();
  jar.set(LOZA_REGISTER_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TRANSIENT_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return { error: null, ok: true };
}

export type CreateAccountState = {
  error: string | null;
};

export async function createAccountAction(
  _prev: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const jar = await cookies();
  const token = jar.get(LOZA_REGISTER_TOKEN_COOKIE)?.value;
  if (!token) {
    return { error: "Phiên đăng ký hết hạn. Vui lòng bắt đầu lại từ bước nhập OTP." };
  }
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const termsRead = formData.get("termsRead") === "on";
  if (!termsRead) {
    return { error: "Vui lòng xác nhận đã đọc Điều khoản và dịch vụ." };
  }
  if (password.length < 8) {
    return { error: "Mật khẩu tối thiểu 8 ký tự." };
  }
  if (password !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }
  if (!displayName) {
    return { error: "Vui lòng nhập tên hiển thị." };
  }
  const deviceId = await getOrCreateDeviceId();
  try {
    const data = await apiFetchPublicJson<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/register/create-account", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
        displayName,
        deviceId,
        platform: "web",
        appVersion: "0.1.0",
        deviceName: "Loza Chat Web",
      }),
    });
    await setAuthCookies(data.accessToken, data.refreshToken);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không tạo được tài khoản." };
  }
  redirect("/");
}
