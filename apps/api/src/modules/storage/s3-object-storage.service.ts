import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import type {
  CreatePresignedPutParams,
  VerifyObjectParams,
} from './object-storage.port';
import {
  ObjectStoragePort,
  type PresignedUploadInstructions,
} from './object-storage.port';

@Injectable()
export class S3ObjectStorageService extends ObjectStoragePort {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    super();
    const storage = this.config.get('storage', { infer: true });
    this.client = new S3Client({
      region: storage.region,
      endpoint: storage.endpoint,
      credentials: {
        accessKeyId: storage.accessKeyId,
        secretAccessKey: storage.secretAccessKey,
      },
      forcePathStyle: !!storage.endpoint,
    });
  }

  async createPresignedPut(
    params: CreatePresignedPutParams,
  ): Promise<PresignedUploadInstructions> {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
    });
    try {
      const url = await getSignedUrl(this.client, command, {
        expiresIn: params.expiresInSeconds,
      });
      return {
        url,
        method: 'PUT',
        headers: { 'Content-Type': params.contentType },
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create presigned URL: ${String(err)}`,
      );
    }
  }

  async verifyObjectPresent(params: VerifyObjectParams): Promise<void> {
    try {
      const out = await this.client.send(
        new HeadObjectCommand({
          Bucket: params.bucket,
          Key: params.key,
        }),
      );
      const len = out.ContentLength;
      if (len === undefined) {
        throw new BadGatewayException('Object has no Content-Length');
      }
      if (BigInt(len) !== params.expectedSizeBytes) {
        throw new BadGatewayException(
          'Uploaded size does not match declared size',
        );
      }
      const ct = out.ContentType ?? '';
      if (!this.contentTypesCompatible(ct, params.expectedContentType)) {
        throw new BadGatewayException('Uploaded content type mismatch');
      }
    } catch (err) {
      if (err instanceof BadGatewayException) {
        throw err;
      }
      throw new BadGatewayException(
        `Object not found or not readable: ${String(err)}`,
      );
    }
  }

  /** Allow charset suffix on Content-Type from some providers. */
  private contentTypesCompatible(actual: string, expected: string): boolean {
    const a = actual.split(';')[0]?.trim().toLowerCase() ?? '';
    const e = expected.split(';')[0]?.trim().toLowerCase() ?? '';
    return a === e;
  }
}
