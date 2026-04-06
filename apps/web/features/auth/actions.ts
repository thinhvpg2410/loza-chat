"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOZA_SESSION_COOKIE } from "@/lib/auth/constants";

export type LoginState = {
  error: string | null;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();

  if (!phone || !otp) {
    return { error: "Vui lòng nhập số điện thoại và mã OTP." };
  }

  const jar = await cookies();
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
  jar.delete(LOZA_SESSION_COOKIE);
  redirect("/login");
}
