/**
 * With STORAGE_MOCK, the API serves bytes at GET /uploads/mock-public?key=...
 * (see API Swagger). For non-mock storage, URLs may need a different strategy later.
 */
export function mockStoragePublicUrl(apiBaseUrl: string, storageKey: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  return `${base}/uploads/mock-public?key=${encodeURIComponent(storageKey)}`;
}
