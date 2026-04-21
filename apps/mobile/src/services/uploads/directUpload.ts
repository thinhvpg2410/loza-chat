import { API_BASE_URL } from "@/constants/env";
import { apiClient } from "@/services/api/client";
import { getAuthState } from "@/store/authStore";

import type { ApiAttachment } from "../conversations/conversationsApi";

type MediaKind = "image" | "file" | "voice" | "video" | "other";

type UploadInitResponse = {
  uploadSessionId: string;
  storageKey: string;
  bucket: string;
  upload: { url: string; method: "PUT"; headers: Record<string, string> };
  expiresAt: string;
};

function resolveUploadPutUrl(presignedUrl: string): string {
  try {
    const presigned = new URL(presignedUrl);
    const api = new URL(API_BASE_URL);
    const loopback =
      presigned.hostname === "localhost" || presigned.hostname === "127.0.0.1";
    const apiNotLoopback = api.hostname !== "localhost" && api.hostname !== "127.0.0.1";
    if (loopback && apiNotLoopback) {
      return `${api.origin}${presigned.pathname}${presigned.search}`;
    }
  } catch {
    /* keep original */
  }
  return presignedUrl;
}

/** Mock-storage PUT goes through our API and needs JWT; S3 presigned must not get Authorization (breaks query sig). */
function needsBearerForUploadPut(uploadUrl: string): boolean {
  try {
    return new URL(uploadUrl).pathname.includes("/uploads/mock-upload/");
  } catch {
    return false;
  }
}

async function readLocalUriAsBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Không đọc được tệp (${res.status})`);
  }
  return res.blob();
}

export type UploadLocalFileOpts = {
  fileUri: string;
  fileName: string;
  mimeType: string;
  uploadType: MediaKind;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

/**
 * Presigned pipeline: POST /uploads/init → PUT bytes → POST /uploads/:id/complete.
 * Uses `fetch(fileUri)` → `blob()` so `ph://`, `content://`, and `file://` (picker) work on device;
 * `expo-file-system` base64 read often fails on library URIs.
 */
export async function uploadLocalFileToAttachment(opts: UploadLocalFileOpts): Promise<ApiAttachment> {
  const blob = await readLocalUriAsBlob(opts.fileUri);
  const fileSize = blob.size;
  if (!fileSize) {
    throw new Error("Tệp rỗng hoặc không đọc được.");
  }
  const mimeType =
    (blob.type && blob.type !== "") ? blob.type : opts.mimeType || "application/octet-stream";

  const { data: init } = await apiClient.post<UploadInitResponse>("/uploads/init", {
    fileName: opts.fileName,
    mimeType,
    fileSize,
    uploadType: opts.uploadType,
    ...(opts.width !== undefined ? { width: opts.width } : {}),
    ...(opts.height !== undefined ? { height: opts.height } : {}),
    ...(opts.durationSeconds !== undefined ? { durationSeconds: opts.durationSeconds } : {}),
  });

  const putUrl = resolveUploadPutUrl(init.upload.url);
  const putHeaders: Record<string, string> = { ...init.upload.headers };
  const token = getAuthState().accessToken;
  if (needsBearerForUploadPut(init.upload.url) && token) {
    putHeaders.Authorization = `Bearer ${token}`;
  }

  const put = await fetch(putUrl, {
    method: init.upload.method,
    headers: putHeaders,
    body: blob,
  });
  if (!put.ok) {
    throw new Error(`Tải lên thất bại (${put.status})`);
  }

  const { data: done } = await apiClient.post<{ attachment: ApiAttachment }>(
    `/uploads/${init.uploadSessionId}/complete`,
  );
  return done.attachment;
}
