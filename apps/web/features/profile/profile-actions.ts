"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { apiFetchJson, getApiBaseUrl } from "@/lib/api/server";
import { LOZA_ACCESS_COOKIE, LOZA_SESSION_COOKIE } from "@/lib/auth/constants";
import { USERNAME_RE } from "@/lib/profile/username";
import type { WebProfileUser } from "@/lib/types/profile";

export type ProfileSettingsState = {
  error: string | null;
  ok?: boolean;
};

export async function checkUsernameAvailableAction(username: string): Promise<boolean> {
  const base = getApiBaseUrl();
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock" || !base) {
    return true;
  }
  const t = username.trim().toLowerCase();
  if (!t) {
    return true;
  }
  const { available } = await apiFetchJson<{ available: boolean }>(
    `/users/username-available?username=${encodeURIComponent(t)}`,
  );
  return available;
}

export async function updateProfileAction(
  _prev: ProfileSettingsState,
  formData: FormData,
): Promise<ProfileSettingsState> {
  const jar = await cookies();
  const isMock = jar.get(LOZA_SESSION_COOKIE)?.value === "mock";

  const displayName = String(formData.get("displayName") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const statusMessage = String(formData.get("statusMessage") ?? "").trim();
  const birthRaw = String(formData.get("birthDate") ?? "").trim();

  if (!displayName) {
    return { error: "Tên hiển thị không được để trống." };
  }

  if (usernameRaw && !USERNAME_RE.test(usernameRaw)) {
    return { error: "Username: 3–30 ký tự: chữ thường, số, _" };
  }

  let birthDate: string | null | undefined = undefined;
  if (birthRaw === "") {
    birthDate = null;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(birthRaw)) {
    birthDate = birthRaw;
  } else {
    return { error: "Ngày sinh không hợp lệ." };
  }

  if (isMock) {
    return { error: null, ok: true };
  }

  const body: Record<string, unknown> = {
    displayName,
    statusMessage,
    ...(birthDate === undefined ? {} : { birthDate }),
    username: usernameRaw === "" ? "" : usernameRaw.toLowerCase(),
  };

  try {
    await apiFetchJson<{ user: WebProfileUser }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không lưu được hồ sơ." };
  }

  revalidatePath("/settings");
  return { error: null, ok: true };
}

export type ChangePasswordState = {
  error: string | null;
  ok?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { error: "Đăng nhập qua API để đổi mật khẩu." };
  }
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword || !newPassword) {
    return { error: "Vui lòng điền đủ các trường." };
  }
  if (newPassword.length < 8) {
    return { error: "Mật khẩu mới tối thiểu 8 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu mới không khớp." };
  }
  try {
    await apiFetchJson<{ message: string }>("/users/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không đổi được mật khẩu." };
  }
  revalidatePath("/settings");
  return { error: null, ok: true };
}

type UploadInitResponse = {
  uploadSessionId: string;
  upload: { url: string; method: "PUT"; headers: Record<string, string> };
};

function needsBearerForUploadPut(uploadUrl: string): boolean {
  try {
    return new URL(uploadUrl).pathname.includes("/uploads/mock-upload/");
  } catch {
    return false;
  }
}

export type AvatarUploadState = { error: string | null; ok?: boolean };

export async function uploadAvatarAction(
  _prev: AvatarUploadState,
  formData: FormData,
): Promise<AvatarUploadState> {
  const jar = await cookies();
  if (jar.get(LOZA_SESSION_COOKIE)?.value === "mock") {
    return { error: "Đăng nhập qua API (LOZA_API_BASE_URL) để đổi ảnh đại diện." };
  }
  const base = getApiBaseUrl();
  if (!base) {
    return { error: "Chưa cấu hình LOZA_API_BASE_URL." };
  }
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Chọn một ảnh." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type && file.type.length > 0 ? file.type : "image/jpeg";
  const fileName = file.name || "avatar.jpg";

  let initJson: UploadInitResponse;
  try {
    initJson = await apiFetchJson<UploadInitResponse>("/uploads/init", {
      method: "POST",
      body: JSON.stringify({
        fileName,
        mimeType,
        fileSize: buf.length,
        uploadType: "image",
      }),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không khởi tạo upload." };
  }

  const jarCookies = await cookies();
  const token = jarCookies.get(LOZA_ACCESS_COOKIE)?.value;
  if (!token) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }

  const putHeaders: Record<string, string> = { ...initJson.upload.headers };
  if (needsBearerForUploadPut(initJson.upload.url)) {
    putHeaders.Authorization = `Bearer ${token}`;
  }

  const put = await fetch(initJson.upload.url, {
    method: "PUT",
    headers: putHeaders,
    body: buf,
  });
  if (!put.ok) {
    return { error: `Upload thất bại (${put.status}).` };
  }

  try {
    await apiFetchJson(`/uploads/${initJson.uploadSessionId}/complete`, {
      method: "POST",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không hoàn tất upload." };
  }

  try {
    await apiFetchJson(`/users/me/avatar`, {
      method: "PATCH",
      body: JSON.stringify({ uploadSessionId: initJson.uploadSessionId }),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không cập nhật avatar." };
  }

  revalidatePath("/settings");
  return { error: null, ok: true };
}
