"use server";

import { getApiBaseUrl } from "@/lib/api/server";
import { getOrCreateDeviceId } from "@/lib/auth/device";
import { setAuthCookies } from "@/lib/auth/set-auth-cookies";

export type CreateQrLoginResult =
  | { ok: true; sessionToken: string; expiresAtIso: string }
  | { ok: false; error: string };

export type PollQrLoginResult =
  | { kind: "active"; phase: "pending" | "scanned"; expiresAtIso: string }
  | { kind: "logged_in" }
  | { kind: "already_delivered" }
  | { kind: "stop"; reason: "expired" | "rejected" | "not_found" }
  | { kind: "network" };

function expiresAtToIso(value: unknown): string {
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export async function createQrLoginSessionAction(): Promise<CreateQrLoginResult> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: "Chưa cấu hình LOZA_API_BASE_URL." };
  }
  try {
    const deviceId = await getOrCreateDeviceId();
    const res = await fetch(`${base}/auth/qr/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        appVersion: "0.1.0",
        deviceName: "Loza Chat Web",
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      let msg = "Không tạo được phiên QR.";
      try {
        const j = (await res.json()) as { message?: string | string[] };
        if (typeof j.message === "string") msg = j.message;
        else if (Array.isArray(j.message)) msg = j.message.join(", ");
      } catch {
        /* ignore */
      }
      return { ok: false, error: msg };
    }
    const data = (await res.json()) as { sessionToken?: string; expiresAt?: string };
    if (typeof data.sessionToken !== "string" || data.sessionToken.length < 64) {
      return { ok: false, error: "Phản hồi tạo QR không hợp lệ." };
    }
    return {
      ok: true,
      sessionToken: data.sessionToken,
      expiresAtIso: expiresAtToIso(data.expiresAt),
    };
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ." };
  }
}

export async function pollQrLoginStatusAction(sessionToken: string): Promise<PollQrLoginResult> {
  const base = getApiBaseUrl();
  if (!base) {
    return { kind: "network" };
  }
  if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
    return { kind: "stop", reason: "not_found" };
  }
  try {
    const res = await fetch(`${base}/auth/qr/status/${sessionToken}`, { cache: "no-store" });
    if (!res.ok) {
      return { kind: "network" };
    }
    const data = (await res.json()) as Record<string, unknown>;
    const status = data.status;

    if (status === "not_found") {
      return { kind: "stop", reason: "not_found" };
    }
    if (status === "expired") {
      return { kind: "stop", reason: "expired" };
    }
    if (status === "rejected") {
      return { kind: "stop", reason: "rejected" };
    }
    if (status === "pending") {
      return {
        kind: "active",
        phase: "pending",
        expiresAtIso: expiresAtToIso(data.expiresAt),
      };
    }
    if (status === "scanned") {
      return {
        kind: "active",
        phase: "scanned",
        expiresAtIso: expiresAtToIso(data.expiresAt),
      };
    }
    if (status === "approved") {
      const already = data.tokensAlreadyDelivered === true;
      if (already) {
        return { kind: "already_delivered" };
      }
      const access = data.accessToken;
      const refresh = data.refreshToken;
      if (typeof access === "string" && typeof refresh === "string" && access.length > 0 && refresh.length > 0) {
        await setAuthCookies(access, refresh);
        return { kind: "logged_in" };
      }
      return { kind: "already_delivered" };
    }

    return { kind: "network" };
  } catch {
    return { kind: "network" };
  }
}
