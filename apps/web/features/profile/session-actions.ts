"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetchJson, getApiBaseUrl } from "@/lib/api/server";
import { LOZA_SESSION_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function revokeSessionAction(
  sessionId: string,
  isCurrent: boolean,
): Promise<{ error: string | null }> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { error: "Đăng nhập qua API để quản lý phiên." };
  }
  if (!getApiBaseUrl()) {
    return { error: "Chưa cấu hình LOZA_API_BASE_URL." };
  }
  const id = sessionId.trim();
  if (!UUID_RE.test(id)) {
    return { error: "Phiên không hợp lệ." };
  }
  try {
    await apiFetchJson(`/sessions/${id}`, { method: "DELETE" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thu hồi được phiên." };
  }

  if (isCurrent) {
    await clearAuthCookies(jar);
    redirect("/login");
  }

  revalidatePath("/settings");
  return { error: null };
}

export async function logoutAllDevicesAction(): Promise<void> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    redirect("/login");
  }
  const base = getApiBaseUrl();
  if (!base) {
    redirect("/login");
  }
  try {
    await apiFetchJson<{ message: string }>("/auth/logout-all", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch {
    /* still clear local session */
  }
  await clearAuthCookies(jar);
  redirect("/login");
}
