import { cookies } from "next/headers";
import {
  LOZA_ACCESS_COOKIE,
  LOZA_DEVICE_VERIFY_TOKEN_COOKIE,
  LOZA_FORGOT_TOKEN_COOKIE,
  LOZA_REFRESH_COOKIE,
  LOZA_REGISTER_TOKEN_COOKIE,
  LOZA_SESSION_COOKIE,
} from "@/lib/auth/constants";

export function hasSessionCookiePair(jar: Awaited<ReturnType<typeof cookies>>): boolean {
  const mock = jar.get(LOZA_SESSION_COOKIE)?.value;
  const access = jar.get(LOZA_ACCESS_COOKIE)?.value;
  return Boolean(mock) || Boolean(access);
}

export async function clearAuthCookies(jar: Awaited<ReturnType<typeof cookies>>): Promise<void> {
  jar.delete(LOZA_SESSION_COOKIE);
  jar.delete(LOZA_ACCESS_COOKIE);
  jar.delete(LOZA_REFRESH_COOKIE);
  jar.delete(LOZA_REGISTER_TOKEN_COOKIE);
  jar.delete(LOZA_FORGOT_TOKEN_COOKIE);
  jar.delete(LOZA_DEVICE_VERIFY_TOKEN_COOKIE);
}
