import { cookies } from "next/headers";
import { LOZA_ACCESS_COOKIE } from "@/lib/auth/constants";

function parseFailedJsonMessage(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.message === "string") return o.message;
  if (Array.isArray(o.message) && o.message.every((x) => typeof x === "string")) {
    return o.message.join(", ");
  }
  const err = o.error;
  if (err && typeof err === "object") {
    const em = (err as Record<string, unknown>).message;
    if (typeof em === "string") return em;
  }
  return undefined;
}

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
      const parsed = parseFailedJsonMessage(await res.json());
      if (parsed) msg = parsed;
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
      const parsed = parseFailedJsonMessage(await res.json());
      if (parsed) msg = parsed;
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
