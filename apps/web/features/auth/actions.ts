"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/server";
import {
  LOZA_ACCESS_COOKIE,
  LOZA_FORGOT_TOKEN_COOKIE,
  LOZA_REFRESH_COOKIE,
  LOZA_REGISTER_TOKEN_COOKIE,
  LOZA_SESSION_COOKIE,
} from "@/lib/auth/constants";
import { getOrCreateDeviceId } from "@/lib/auth/device";
import { setAuthCookies } from "@/lib/auth/set-auth-cookies";
import { clearAuthCookies } from "@/lib/auth/session";
import { normalizeLoginIdentifierForApi } from "@/lib/contact/contactToApiPayload";

export type LoginState = {
  error: string | null;
};

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
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
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
  jar.set(LOZA_SESSION_COOKIE, "mock", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
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
