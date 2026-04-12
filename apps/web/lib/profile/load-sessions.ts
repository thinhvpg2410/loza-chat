import { cookies } from "next/headers";
import { apiFetchJson } from "@/lib/api/server";
import { LOZA_SESSION_COOKIE } from "@/lib/auth/constants";
import type { WebUserSession } from "@/lib/types/session";

export type SessionsSettingsLoad =
  | { kind: "mock" }
  | { kind: "api"; sessions: WebUserSession[] }
  | { kind: "error"; message: string };

export async function loadSessionsForSettings(): Promise<SessionsSettingsLoad> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { kind: "mock" };
  }
  try {
    const { sessions } = await apiFetchJson<{ sessions: WebUserSession[] }>("/sessions");
    return { kind: "api", sessions: Array.isArray(sessions) ? sessions : [] };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Không tải được danh sách phiên đăng nhập.",
    };
  }
}
