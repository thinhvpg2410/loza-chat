import { BadRequestException } from '@nestjs/common';

export interface MessageCursorPayload {
  createdAt: string;
  id: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function encodeMessageCursor(payload: MessageCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeMessageCursor(cursor: string): MessageCursorPayload {
  let raw: string;
  try {
    raw = Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('createdAt' in parsed) ||
    !('id' in parsed)
  ) {
    throw new BadRequestException('Invalid cursor');
  }

  const createdAt = (parsed as { createdAt: unknown }).createdAt;
  const id = (parsed as { id: unknown }).id;

  if (typeof createdAt !== 'string' || typeof id !== 'string') {
    throw new BadRequestException('Invalid cursor');
  }

  if (!isUuid(id)) {
    throw new BadRequestException('Invalid cursor');
  }

  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) {
    throw new BadRequestException('Invalid cursor');
  }

  return { createdAt: new Date(t).toISOString(), id };
}
