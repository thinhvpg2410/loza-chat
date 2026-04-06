import { BadRequestException } from '@nestjs/common';

const E164_PHONE = /^\+[1-9]\d{6,14}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertE164Phone(phone: string): string {
  const t = phone.trim();
  if (!E164_PHONE.test(t)) {
    throw new BadRequestException(
      'phoneNumber must be E.164 format (e.g. +84901234567)',
    );
  }
  return t;
}

export function parseLoginIdentifier(identifier: string): {
  kind: 'email';
  email: string;
  phoneNumber: null;
} | { kind: 'phone'; email: null; phoneNumber: string } {
  const trimmed = identifier.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException('identifier is required');
  }
  if (trimmed.includes('@')) {
    return { kind: 'email', email: normalizeEmail(trimmed), phoneNumber: null };
  }
  return {
    kind: 'phone',
    email: null,
    phoneNumber: assertE164Phone(trimmed),
  };
}
