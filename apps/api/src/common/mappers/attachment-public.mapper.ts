import type { Attachment } from '@prisma/client';
import type { AttachmentPublicDto } from '../../modules/uploads/dto/upload-complete-response.dto';

export function toAttachmentPublicDto(row: Attachment): AttachmentPublicDto {
  return {
    id: row.id,
    storageKey: row.storageKey,
    bucket: row.bucket,
    mimeType: row.mimeType,
    originalFileName: row.originalFileName,
    fileSize: row.fileSize.toString(),
    attachmentType: row.attachmentType,
    width: row.width,
    height: row.height,
    durationSeconds: row.durationSeconds,
    thumbnailKey: row.thumbnailKey,
    createdAt: row.createdAt,
  };
}
