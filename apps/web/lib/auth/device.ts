import { cookies } from "next/headers";
import { LOZA_DEVICE_COOKIE } from "@/lib/auth/constants";

const DEVICE_MAX_AGE = 60 * 60 * 24 * 400;

export async function getOrCreateDeviceId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(LOZA_DEVICE_COOKIE)?.value?.trim();
  if (id && id.length >= 8) {
    return id;
  }
  id = crypto.randomUUID();
  jar.set(LOZA_DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_MAX_AGE,
  });
  return id;
}
