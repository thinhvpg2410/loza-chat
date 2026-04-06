import { cookies } from "next/headers";
import { LOZA_ACCESS_COOKIE } from "@/lib/auth/constants";

export function getApiBaseUrl(): string | undefined {
  const u = process.env.LOZA_API_BASE_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, "") : undefined;
}

/** Unauthenticated JSON request (auth registration / forgot-password flows). */
export async function apiFetchPublicJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("LOZA_API_BASE_URL is not configured");
  }
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (typeof j.message === "string") msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("LOZA_API_BASE_URL is not configured");
  }
  const jar = await cookies();
  const token = jar.get(LOZA_ACCESS_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (typeof j.message === "string") msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
