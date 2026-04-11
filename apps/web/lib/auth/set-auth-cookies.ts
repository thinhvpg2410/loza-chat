import { cookies } from "next/headers";
import {
  LOZA_ACCESS_COOKIE,
  LOZA_DEVICE_VERIFY_TOKEN_COOKIE,
  LOZA_FORGOT_TOKEN_COOKIE,
  LOZA_REFRESH_COOKIE,
  LOZA_REGISTER_TOKEN_COOKIE,
  LOZA_SESSION_COOKIE,
} from "@/lib/auth/constants";

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const jar = await cookies();
  jar.set(LOZA_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  jar.set(LOZA_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  jar.delete(LOZA_SESSION_COOKIE);
  jar.delete(LOZA_REGISTER_TOKEN_COOKIE);
  jar.delete(LOZA_FORGOT_TOKEN_COOKIE);
  jar.delete(LOZA_DEVICE_VERIFY_TOKEN_COOKIE);
}
