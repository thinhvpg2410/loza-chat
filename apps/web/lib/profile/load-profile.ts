import { cookies } from "next/headers";
import { apiFetchJson } from "@/lib/api/server";
import { LOZA_SESSION_COOKIE } from "@/lib/auth/constants";
import { MOCK_WEB_PROFILE } from "@/lib/profile/mock-profile";
import type { WebProfileUser } from "@/lib/types/profile";

export type ProfileSettingsLoad =
  | { kind: "mock"; user: WebProfileUser }
  | { kind: "api"; user: WebProfileUser };

export async function loadProfileForSettings(): Promise<ProfileSettingsLoad> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { kind: "mock", user: MOCK_WEB_PROFILE };
  }
  const { user } = await apiFetchJson<{ user: WebProfileUser }>("/users/me");
  return { kind: "api", user };
}
