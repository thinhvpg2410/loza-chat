import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaKind, MessageType } from '@prisma/client';
import type { AppConfiguration } from '../../config/configuration';
import { isMimeAllowedForKind } from './constants/allowed-mime';

@Injectable()
export class UploadRulesService {
  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  maxBytesForUploadKind(kind: MediaKind): number {
    const u = this.config.get('upload', { infer: true });
    switch (kind) {
      case MediaKind.image:
        return u.maxImageBytes;
      case MediaKind.file:
        return u.maxFileBytes;
      case MediaKind.voice:
        return u.maxVoiceBytes;
      case MediaKind.video:
        return u.maxVideoBytes;
      case MediaKind.other:
        return u.maxOtherBytes;
      default: {
        const _e: never = kind;
        return _e;
      }
    }
  }

  assertMimeAndSize(kind: MediaKind, mimeType: string, fileSize: bigint): void {
    if (fileSize <= 0n) {
      throw new BadRequestException('fileSize must be positive');
    }
    const max = BigInt(this.maxBytesForUploadKind(kind));
    if (fileSize > max) {
      throw new BadRequestException(
        `File too large for ${kind} (max ${max.toString()} bytes)`,
      );
    }
    if (!isMimeAllowedForKind(mimeType, kind)) {
      throw new BadRequestException(
        `MIME type not allowed for upload type ${kind}`,
      );
    }
  }

  maxAttachmentsForMessage(): number {
    return this.config.get('upload', { infer: true }).maxAttachmentsPerMessage;
  }

  assertAttachmentIdsForMessageType(
    messageType: MessageType,
    attachmentCount: number,
  ): void {
    const max = this.maxAttachmentsForMessage();
    if (attachmentCount < 1) {
      throw new BadRequestException('At least one attachment is required');
    }
    if (attachmentCount > max) {
      throw new BadRequestException(
        `Too many attachments (max ${max} per message)`,
      );
    }
    switch (messageType) {
      case MessageType.system:
        throw new BadRequestException('System messages cannot have attachments');
      case MessageType.sticker:
        throw new BadRequestException(
          'Use POST /messages/sticker for sticker messages',
        );
      case MessageType.voice:
        if (attachmentCount !== 1) {
          throw new BadRequestException(
            'Voice messages support exactly one attachment',
          );
        }
        break;
      case MessageType.video:
        if (attachmentCount !== 1) {
          throw new BadRequestException(
            'Video messages support exactly one attachment',
          );
        }
        break;
      case MessageType.text:
        throw new BadRequestException(
          'Use POST /messages for text-only messages',
        );
      default:
        break;
    }
  }

  assertAttachmentsMatchMessageType(
    messageType: MessageType,
    attachmentTypes: MediaKind[],
  ): void {
    if (messageType === MessageType.other) {
      return;
    }
    const expected = messageTypeToMediaKind(messageType);
    if (!expected) {
      return;
    }
    for (const t of attachmentTypes) {
      if (t !== expected) {
        throw new BadRequestException(
          `Attachment type ${t} does not match message type ${messageType}`,
        );
      }
    }
  }

  assertVoiceDurationSeconds(durationSeconds: number | null | undefined): void {
    if (durationSeconds === null || durationSeconds === undefined) {
      throw new BadRequestException('Voice upload must provide durationSeconds metadata');
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new BadRequestException('Voice durationSeconds must be a positive number');
    }
    if (durationSeconds > 60 * 10) {
      throw new BadRequestException('Voice duration exceeds max allowed (600s)');
    }
  }
}

function messageTypeToMediaKind(t: MessageType): MediaKind | null {
    switch (t) {
      case MessageType.system:
        return null;
      case MessageType.sticker:
        return null;
      case MessageType.image:
      return MediaKind.image;
    case MessageType.file:
      return MediaKind.file;
    case MessageType.voice:
      return MediaKind.voice;
    case MessageType.video:
      return MediaKind.video;
    case MessageType.other:
      return null;
    default:
      return null;
  }
}
