import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UploadSessionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStoragePort } from '../storage/object-storage.port';
import type { UploadInitDto } from './dto/upload-init.dto';
import { toAttachmentPublicDto } from '../../common/mappers/attachment-public.mapper';
import type { AttachmentPublicDto } from './dto/upload-complete-response.dto';
import { UploadRulesService } from './upload-rules.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStoragePort,
    private readonly rules: UploadRulesService,
    private readonly config: ConfigService<AppConfiguration, true>,
  ) {}

  async initSession(
    userId: string,
    dto: UploadInitDto,
  ): Promise<{
    uploadSessionId: string;
    storageKey: string;
    bucket: string;
    upload: { url: string; method: 'PUT'; headers: Record<string, string> };
    expiresAt: Date;
  }> {
    const fileSize = BigInt(dto.fileSize);
    this.rules.assertMimeAndSize(dto.uploadType, dto.mimeType, fileSize);

    const uploadCfg = this.config.get('upload', { infer: true });
    const storageCfg = this.config.get('storage', { infer: true });
    if (!storageCfg.mock && !storageCfg.bucket) {
      throw new BadRequestException('Object storage is not configured');
    }
    const bucket = storageCfg.bucket || 'mock-bucket';

    const sessionId = randomUUID();
    const safeSegment = randomUUID();
    const storageKey = `uploads/${userId}/${sessionId}/${safeSegment}`;

    const expiresAt = new Date(
      Date.now() + uploadCfg.sessionExpiresMinutes * 60_000,
    );

    const metadataJson: Prisma.InputJsonValue | undefined =
      dto.metadata ||
      dto.width !== undefined ||
      dto.height !== undefined ||
      dto.durationSeconds !== undefined
        ? ({
            ...(dto.metadata ?? {}),
            ...(dto.width !== undefined ? { width: dto.width } : {}),
            ...(dto.height !== undefined ? { height: dto.height } : {}),
            ...(dto.durationSeconds !== undefined
              ? { durationSeconds: dto.durationSeconds }
              : {}),
          } as Prisma.InputJsonValue)
        : undefined;

    const session = await this.prisma.uploadSession.create({
      data: {
        id: sessionId,
        userId,
        storageKey,
        bucket,
        mimeType: dto.mimeType,
        originalFileName: dto.fileName.slice(0, 512),
        fileSize,
        uploadType: dto.uploadType,
        status: UploadSessionStatus.pending,
        expiresAt,
        metadataJson,
      },
    });

    const signed = await this.storage.createPresignedPut({
      bucket,
      key: storageKey,
      contentType: dto.mimeType,
      expiresInSeconds: uploadCfg.presignExpiresSeconds,
    });

    return {
      uploadSessionId: session.id,
      storageKey: session.storageKey,
      bucket: session.bucket,
      upload: {
        url: signed.url,
        method: signed.method,
        headers: signed.headers,
      },
      expiresAt: session.expiresAt,
    };
  }

  async completeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ attachment: AttachmentPublicDto }> {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Upload session not found');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not your upload session');
    }
    if (session.status !== UploadSessionStatus.pending) {
      throw new BadRequestException(
        `Upload session is not pending (status=${session.status})`,
      );
    }
    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: UploadSessionStatus.expired },
      });
      throw new BadRequestException('Upload session expired');
    }

    await this.storage.verifyObjectPresent({
      bucket: session.bucket,
      key: session.storageKey,
      expectedContentType: session.mimeType,
      expectedSizeBytes: session.fileSize,
    });

    const meta = session.metadataJson as
      | { width?: number; height?: number; durationSeconds?: number }
      | null
      | undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.uploadSession.update({
        where: { id: sessionId },
        data: {
          status: UploadSessionStatus.uploaded,
          completedAt: new Date(),
        },
      });

      const attachment = await tx.attachment.create({
        data: {
          uploadedById: userId,
          uploadSessionId: updated.id,
          storageKey: updated.storageKey,
          bucket: updated.bucket,
          mimeType: updated.mimeType,
          originalFileName: updated.originalFileName,
          fileSize: updated.fileSize,
          attachmentType: updated.uploadType,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
          durationSeconds: meta?.durationSeconds ?? null,
          sortOrder: 0,
        },
      });

      return attachment;
    });

    return { attachment: toAttachmentPublicDto(result) };
  }
}
