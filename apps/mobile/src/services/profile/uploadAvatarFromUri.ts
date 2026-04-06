import { mapPublicUserToAuthUser } from "@/services/api/mapPublicUser";
import { apiClient } from "@/services/api/client";
import { getAuthState, type AuthUser } from "@/store/authStore";

type PublicUserDto = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
};

/** STORAGE_MOCK PUT hits our API and needs JWT; S3 presigned URLs must not receive Authorization (conflicts with X-Amz-*). */
function needsBearerForUploadPut(uploadUrl: string): boolean {
  try {
    return new URL(uploadUrl).pathname.includes("/uploads/mock-upload/");
  } catch {
    return false;
  }
}

/**
 * Presigned upload pipeline: POST /uploads/init → PUT → POST /uploads/:id/complete → PATCH /users/me/avatar.
 * Requires a valid access token (Authorization interceptor).
 */
export async function uploadAvatarFromLocalUri(
  localUri: string,
  mimeTypeHint?: string | null,
): Promise<AuthUser> {
  const res = await fetch(localUri);
  const blob = await res.blob();
  const mimeType = (blob.type && blob.type !== "") ? blob.type : mimeTypeHint || "image/jpeg";
  const fileSize = blob.size;
  const fileName = localUri.split("/").pop()?.split("?")[0] || "avatar.jpg";

  const { data: init } = await apiClient.post<{
    uploadSessionId: string;
    upload: { url: string; method: "PUT"; headers: Record<string, string> };
  }>("/uploads/init", {
    fileName,
    mimeType,
    fileSize,
    uploadType: "image",
  });

  const token = getAuthState().accessToken;
  const putHeaders: Record<string, string> = { ...init.upload.headers };
  if (needsBearerForUploadPut(init.upload.url) && token) {
    putHeaders.Authorization = `Bearer ${token}`;
  }

  const put = await fetch(init.upload.url, {
    method: "PUT",
    headers: putHeaders,
    body: blob,
  });
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status})`);
  }

  await apiClient.post(`/uploads/${init.uploadSessionId}/complete`);

  const { data: avatarRes } = await apiClient.patch<{ user: PublicUserDto }>("/users/me/avatar", {
    uploadSessionId: init.uploadSessionId,
  });

  return mapPublicUserToAuthUser(avatarRes.user);
}
