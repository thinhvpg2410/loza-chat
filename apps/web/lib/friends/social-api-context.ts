import { getWebApiSession, type WebApiInactiveReason } from "@/lib/auth/web-api-session";

export type SocialApiContext =
  | { ok: false; reason: WebApiInactiveReason }
  | { ok: true };

export async function getSocialApiContext(): Promise<SocialApiContext> {
  const session = await getWebApiSession();
  if (!session.active) return { ok: false, reason: session.reason };
  return { ok: true };
}
