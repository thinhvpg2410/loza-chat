import { MediaKind } from '@prisma/client';

const IMAGE = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const FILE = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const VOICE = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/amr',
]);

const VIDEO = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

export function allowedMimeTypesFor(kind: MediaKind): Set<string> {
  switch (kind) {
    case MediaKind.image:
      return IMAGE;
    case MediaKind.file:
      return FILE;
    case MediaKind.voice:
      return VOICE;
    case MediaKind.video:
      return VIDEO;
    case MediaKind.other:
      return new Set([...IMAGE, ...FILE, ...VOICE, ...VIDEO]);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function isMimeAllowedForKind(mime: string, kind: MediaKind): boolean {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return allowedMimeTypesFor(kind).has(base);
}
