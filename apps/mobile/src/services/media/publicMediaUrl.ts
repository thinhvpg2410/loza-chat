import { API_BASE_URL } from "@/constants/env";

/** Build a fetchable URL for an attachment `storageKey` (matches API mock-public behavior). */
export function publicUrlForStorageKey(storageKey: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/uploads/mock-public?key=${encodeURIComponent(storageKey)}`;
}

type AttachmentPublicFields = {
  storageKey: string;
  publicUrl?: string | null;
};

/** Prefer server `publicUrl` (S3/CDN); fall back to mock-public under API base. */
export function attachmentPublicReadUrl(att: AttachmentPublicFields): string {
  const direct = typeof att.publicUrl === "string" ? att.publicUrl.trim() : "";
  if (direct.length > 0) return direct;
  return publicUrlForStorageKey(att.storageKey);
}
