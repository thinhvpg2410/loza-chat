import * as FileSystem from "expo-file-system";

import { API_BASE_URL } from "@/constants/env";
import { apiClient } from "@/services/api/client";

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

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function uploadLocalFileToAttachment(opts: {
  fileUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadType: MediaKind;
  width?: number;
  height?: number;
}): Promise<ApiAttachment> {
  const { data: init } = await apiClient.post<UploadInitResponse>("/uploads/init", {
    fileName: opts.fileName,
    mimeType: opts.mimeType,
    fileSize: opts.fileSize,
    uploadType: opts.uploadType,
    ...(opts.width !== undefined ? { width: opts.width } : {}),
    ...(opts.height !== undefined ? { height: opts.height } : {}),
  });

  const putUrl = resolveUploadPutUrl(init.upload.url);
  const base64 = await FileSystem.readAsStringAsync(opts.fileUri, {
    encoding: "base64",
  });
  const body = base64ToUint8Array(base64);

  const headers: Record<string, string> = { ...init.upload.headers };
  const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const res = await fetch(putUrl, {
    method: init.upload.method,
    headers,
    body: arrayBuffer,
  });
  if (!res.ok) {
    throw new Error(`Tải lên thất bại (${res.status})`);
  }

  const { data: done } = await apiClient.post<{ attachment: ApiAttachment }>(
    `/uploads/${init.uploadSessionId}/complete`,
  );
  return done.attachment;
}
