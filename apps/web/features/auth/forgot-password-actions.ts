"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetchPublicJson } from "@/lib/api/server";
import { contactToApiPayload } from "@/lib/contact/contactToApiPayload";
import { LOZA_FORGOT_TOKEN_COOKIE } from "@/lib/auth/constants";

const TRANSIENT_MAX_AGE = 60 * 15;

export type ForgotStepState = {
  error: string | null;
  ok?: boolean;
};

export async function requestForgotPasswordOtpAction(
  _prev: ForgotStepState,
  formData: FormData,
): Promise<ForgotStepState> {
  const contact = String(formData.get("contact") ?? "").trim();
  const payload = contactToApiPayload(contact);
  if (!payload) {
    return { error: "Vui lòng nhập email hợp lệ hoặc số điện thoại." };
  }
  try {
    await apiFetchPublicJson<{ message: string }>("/auth/forgot-password/request-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không gửi được mã OTP." };
  }
  return { error: null, ok: true };
}

export async function verifyForgotPasswordOtpAction(
  _prev: ForgotStepState,
  formData: FormData,
): Promise<ForgotStepState> {
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
    const res = await apiFetchPublicJson<{ token: string }>("/auth/forgot-password/verify-otp", {
      method: "POST",
      body: JSON.stringify({ ...payload, otp }),
    });
    token = res.token;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Mã OTP không đúng hoặc đã hết hạn." };
  }
  const jar = await cookies();
  jar.set(LOZA_FORGOT_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TRANSIENT_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return { error: null, ok: true };
}

export type ResetPasswordState = {
  error: string | null;
};

export async function resetForgotPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const jar = await cookies();
  const token = jar.get(LOZA_FORGOT_TOKEN_COOKIE)?.value;
  if (!token) {
    return { error: "Phiên đặt lại mật khẩu hết hạn. Vui lòng bắt đầu lại." };
  }
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (newPassword.length < 8) {
    return { error: "Mật khẩu mới tối thiểu 8 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }
  try {
    await apiFetchPublicJson<{ message: string }>("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không đặt lại được mật khẩu." };
  }
  jar.delete(LOZA_FORGOT_TOKEN_COOKIE);
  redirect("/login?reset=1");
}
