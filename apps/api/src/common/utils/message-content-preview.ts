import { MessageType } from '@prisma/client';

const MAX_PREVIEW_LEN = 240;

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

/**
 * Short text suitable for inbox / notification previews (not full message body).
 */
export function messageContentPreview(
  type: MessageType,
  content: string | null,
): string | null {
  if (content && content.trim().length > 0) {
    const singleLine = content.replace(/\s+/g, ' ').trim();
    return truncate(singleLine, MAX_PREVIEW_LEN);
  }

  switch (type) {
    case MessageType.system:
      return content && content.trim().length > 0
        ? truncate(
            content.replace(/\s+/g, ' ').trim(),
            MAX_PREVIEW_LEN,
          )
        : '[Update]';
    case MessageType.image:
      return '[Image]';
    case MessageType.file:
      return '[File]';
    case MessageType.voice:
      return '[Voice]';
    case MessageType.video:
      return '[Video]';
    case MessageType.other:
      return '[Attachment]';
    case MessageType.text:
    default:
      return null;
  }
}
