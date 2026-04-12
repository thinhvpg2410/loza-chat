/** Idempotent send key: unique per sender per conversation (server max 128 chars). */
export function newClientMessageId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return `cm-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
