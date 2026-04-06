"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/server";
import {
  LOZA_ACCESS_COOKIE,
  LOZA_DEVICE_VERIFY_TOKEN_COOKIE,
  LOZA_FORGOT_TOKEN_COOKIE,
  LOZA_REFRESH_COOKIE,
  LOZA_REGISTER_TOKEN_COOKIE,
  LOZA_SESSION_COOKIE,
} from "@/lib/auth/constants";
import { getOrCreateDeviceId } from "@/lib/auth/device";
import { setAuthCookies } from "@/lib/auth/set-auth-cookies";
import { clearAuthCookies } from "@/lib/auth/session";
import { normalizeLoginIdentifierForApi } from "@/lib/contact/contactToApiPayload";

const DEVICE_VERIFY_MAX_AGE = 60 * 15;

export type LoginState = {
  error: string | null;
  /** After /auth/login returns a trusted-device challenge (API mode). */
  awaitingDeviceOtp?: boolean;
  otpChannel?: "phone" | "email";
};

export type VerifyDeviceLoginState = {
  error: string | null;
};

function isDeviceLoginChallenge(o: Record<string, unknown>): o is {
  deviceVerificationToken: string;
  otpChannel: "phone" | "email";
} {
  return (
    o.requiresDeviceVerification === true &&
    typeof o.deviceVerificationToken === "string" &&
    o.deviceVerificationToken.length >= 20 &&
    (o.otpChannel === "phone" || o.otpChannel === "email")
  );
}

function isTrustedLoginSession(o: Record<string, unknown>): o is {
  accessToken: string;
  refreshToken: string;
} {
  if (o.requiresDeviceVerification === true) {
    return false;
  }
  return typeof o.accessToken === "string" && typeof o.refreshToken === "string";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const base = getApiBaseUrl();

  if (base) {
    const rawIdentifier = String(formData.get("identifier") ?? "").trim();
    const identifier = normalizeLoginIdentifierForApi(rawIdentifier);
    const password = String(formData.get("password") ?? "");
    if (!identifier || !password) {
      return { error: "Vui lòng nhập email/số điện thoại và mật khẩu." };
    }
    const deviceId = await getOrCreateDeviceId();
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password,
          deviceId,
          platform: "web",
          appVersion: "0.1.0",
          deviceName: "Loza Chat Web",
        }),
      });
      if (!res.ok) {
        let msg = "Đăng nhập thất bại.";
        try {
          const j = (await res.json()) as { message?: string | string[] };
          if (typeof j.message === "string") msg = j.message;
          else if (Array.isArray(j.message)) msg = j.message.join(", ");
        } catch {
          /* ignore */
        }
        return { error: msg };
      }
      const data = (await res.json()) as Record<string, unknown>;
      if (isDeviceLoginChallenge(data)) {
        const jar = await cookies();
        jar.set(LOZA_DEVICE_VERIFY_TOKEN_COOKIE, data.deviceVerificationToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: DEVICE_VERIFY_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
        return {
          error: null,
          awaitingDeviceOtp: true,
          otpChannel: data.otpChannel,
        };
      }
      if (!isTrustedLoginSession(data)) {
        return { error: "Phản hồi đăng nhập không hợp lệ." };
      }
      await setAuthCookies(data.accessToken, data.refreshToken);
    } catch {
      return { error: "Không kết nối được máy chủ. Kiểm tra LOZA_API_BASE_URL." };
    }
    redirect("/");
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) {
    return { error: "Vui lòng nhập số điện thoại và mật khẩu." };
  }

  const jar = await cookies();
  jar.delete(LOZA_ACCESS_COOKIE);
  jar.delete(LOZA_REFRESH_COOKIE);
  jar.delete(LOZA_REGISTER_TOKEN_COOKIE);
  jar.delete(LOZA_FORGOT_TOKEN_COOKIE);
  jar.delete(LOZA_DEVICE_VERIFY_TOKEN_COOKIE);
  jar.set(LOZA_SESSION_COOKIE, "mock", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
}

export async function verifyDeviceLoginAction(
  _prev: VerifyDeviceLoginState,
  formData: FormData,
): Promise<VerifyDeviceLoginState> {
  const base = getApiBaseUrl();
  if (!base) {
    return { error: "API chưa được cấu hình." };
  }
  const jar = await cookies();
  const token = jar.get(LOZA_DEVICE_VERIFY_TOKEN_COOKIE)?.value;
  if (!token) {
    return { error: "Phiên xác thực thiết bị hết hạn. Vui lòng đăng nhập lại." };
  }
  const otp = String(formData.get("otp") ?? "").trim();
  if (!/^\d{6}$/.test(otp)) {
    return { error: "Mã gồm đúng 6 chữ số." };
  }
  try {
    const res = await fetch(`${base}/auth/login/verify-device-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceVerificationToken: token, otp }),
    });
    if (!res.ok) {
      let msg = "Mã không đúng hoặc đã hết hạn.";
      try {
        const j = (await res.json()) as { message?: string | string[] };
        if (typeof j.message === "string") msg = j.message;
        else if (Array.isArray(j.message)) msg = j.message.join(", ");
      } catch {
        /* ignore */
      }
      return { error: msg };
    }
    const data = (await res.json()) as Record<string, unknown>;
    if (!isTrustedLoginSession(data)) {
      return { error: "Phản hồi xác thực không hợp lệ." };
    }
    await setAuthCookies(data.accessToken, data.refreshToken);
    jar.delete(LOZA_DEVICE_VERIFY_TOKEN_COOKIE);
  } catch {
    return { error: "Không kết nối được máy chủ." };
  }
  redirect("/");
}

export async function cancelDeviceVerificationAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(LOZA_DEVICE_VERIFY_TOKEN_COOKIE);
  redirect("/login");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const base = getApiBaseUrl();
  const refresh = jar.get(LOZA_REFRESH_COOKIE)?.value;
  if (base && refresh) {
    try {
      await fetch(`${base}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* ignore */
    }
  }
  await clearAuthCookies(jar);
  redirect("/login");
}
