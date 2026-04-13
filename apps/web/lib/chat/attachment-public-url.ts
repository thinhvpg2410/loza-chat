import type { ApiAttachment } from "@/lib/chat/api-dtos";

/**
 * With STORAGE_MOCK, the API serves bytes at GET /uploads/mock-public?key=...
 * (see API Swagger). Prefer `publicUrl` from the API when present (real S3/CDN).
 */
export function mockStoragePublicUrl(apiBaseUrl: string, storageKey: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  return `${base}/uploads/mock-public?key=${encodeURIComponent(storageKey)}`;
}

export function attachmentReadUrl(
  apiBaseUrl: string,
  att: Pick<ApiAttachment, "storageKey" | "publicUrl">,
): string {
  const direct = typeof att.publicUrl === "string" ? att.publicUrl.trim() : "";
  if (direct.length > 0) return direct;
  return mockStoragePublicUrl(apiBaseUrl, att.storageKey);
}
