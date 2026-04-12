import { API_BASE_URL } from "@/constants/env";

/** Build a fetchable URL for an attachment `storageKey` (matches API mock-public behavior). */
export function publicUrlForStorageKey(storageKey: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/uploads/mock-public?key=${encodeURIComponent(storageKey)}`;
}
