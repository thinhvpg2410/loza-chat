import { randomUUID } from 'crypto';
import type { Request } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';

export function newCorrelationId(): string {
  return randomUUID();
}

export function resolveCorrelationIdFromRequest(req: Request): string {
  const fromHeader = req.header(CORRELATION_HEADER);
  if (fromHeader && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }
  return newCorrelationId();
}
