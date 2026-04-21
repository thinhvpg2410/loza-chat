import { completeChatUploadAction, initChatUploadAction } from "@/features/chat/chat-actions";

export async function uploadGroupAvatarFile(
  file: File,
): Promise<{ ok: true; publicReadUrl: string } | { ok: false; error: string }> {
  if (!file.type.toLowerCase().startsWith("image/")) {
    return { ok: false, error: "Vui lòng chọn tệp ảnh hợp lệ." };
  }
  const normalizedMime = file.type.trim().toLowerCase() || "image/jpeg";
  const init = await initChatUploadAction({
    fileName: file.name || "group-avatar.jpg",
    mimeType: normalizedMime,
    fileSize: file.size,
    uploadType: "image",
  });
  if (!init.ok) return { ok: false, error: init.error };

  const headers: Record<string, string> = { ...init.uploadHeaders };
  if (init.putBearerToken) {
    headers.Authorization = `Bearer ${init.putBearerToken}`;
  }

  const putRes = await fetch(init.uploadUrl, {
    method: init.uploadMethod,
    headers,
    body: file,
  });
  if (!putRes.ok) {
    return { ok: false, error: `Upload thất bại (${putRes.status}).` };
  }

  const done = await completeChatUploadAction(init.uploadSessionId);
  if (!done.ok) return { ok: false, error: done.error };
  return { ok: true, publicReadUrl: done.publicReadUrl };
}
