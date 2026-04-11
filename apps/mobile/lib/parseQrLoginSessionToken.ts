/**
 * Trích `sessionToken` (64 hex) từ nội dung QR web — khớp `buildWebQrLoginPayload`:
 * `mobile://qr-login?session=<token>` hoặc prefix tùy chỉnh có query `session=`.
 */
export function parseQrLoginSessionToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const bare = /^[a-f0-9]{64}$/i.exec(trimmed);
  if (bare) return bare[0].toLowerCase();

  const fromQuery = /(?:[?&#])session=([a-f0-9]{64})(?:&|#|$)/i.exec(trimmed);
  if (fromQuery) return fromQuery[1].toLowerCase();

  const tail = /([a-f0-9]{64})\s*$/i.exec(trimmed);
  if (tail) return tail[1].toLowerCase();

  return null;
}
