import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
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

/**
 * Dev-only: no S3. Presigned URL points at this API (PUT /uploads/mock-upload/:sessionId).
 * Complete step skips real HEAD verification.
 */
@Injectable()
export class MockObjectStorageService extends ObjectStoragePort {
  private readonly logger = new Logger(MockObjectStorageService.name);

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    super();
  }

  createPresignedPut(
    params: CreatePresignedPutParams,
  ): Promise<PresignedUploadInstructions> {
    const uploadSessionId = params.uploadSessionId;
    if (!uploadSessionId) {
      throw new InternalServerErrorException(
        'Mock storage requires uploadSessionId for presigned URL',
      );
    }
    const port = this.config.get('port', { infer: true });
    const raw = (this.config.get('apiPublicBaseUrl', { infer: true }) ?? '').trim();
    const base =
      raw.length > 0
        ? raw.replace(/\/$/, '')
        : `http://127.0.0.1:${port}`;
    const url = `${base}/uploads/mock-upload/${uploadSessionId}`;
    this.logger.debug(`Mock presigned PUT -> ${url} (key=${params.key})`);
    return Promise.resolve({
      url,
      method: 'PUT',
      headers: { 'Content-Type': params.contentType },
    });
  }

  verifyObjectPresent(params: VerifyObjectParams): Promise<void> {
    void params;
    this.logger.debug('Mock verifyObjectPresent — skipped');
    return Promise.resolve();
  }
}
