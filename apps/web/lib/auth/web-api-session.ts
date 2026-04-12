import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api/server";
import { LOZA_ACCESS_COOKIE, LOZA_SESSION_COOKIE } from "@/lib/auth/constants";

/** Why the browser is not in an authenticated API session (chat, friends, etc.). */
export type WebApiInactiveReason = "no_api" | "mock_session" | "no_token";

export type WebApiSessionResult =
  | { active: false; reason: WebApiInactiveReason }
  | { active: true; baseUrl: string };

/**
 * Single gate for server code that calls LOZA_API with the access-token cookie.
 * Matches: mock demo session, missing env, or missing JWT.
 */
export async function getWebApiSession(): Promise<WebApiSessionResult> {
  const base = getApiBaseUrl();
  const jar = await cookies();
  if (!base) return { active: false, reason: "no_api" };
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { active: false, reason: "mock_session" };
  }
  if (!jar.get(LOZA_ACCESS_COOKIE)?.value) {
    return { active: false, reason: "no_token" };
  }
  return { active: true, baseUrl: base };
}
