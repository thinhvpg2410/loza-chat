import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreatePresignedPutParams,
  VerifyObjectParams,
} from './object-storage.port';
import {
  ObjectStoragePort,
  type PresignedUploadInstructions,
} from './object-storage.port';

/**
 * Dev-only: no S3 calls. Complete step skips real HEAD verification.
 */
@Injectable()
export class MockObjectStorageService extends ObjectStoragePort {
  private readonly logger = new Logger(MockObjectStorageService.name);

  createPresignedPut(
    params: CreatePresignedPutParams,
  ): Promise<PresignedUploadInstructions> {
    const fake = `https://mock-storage.local/presigned/${randomUUID()}?key=${encodeURIComponent(params.key)}`;
    this.logger.debug(`Mock presigned PUT for ${params.key}`);
    return Promise.resolve({
      url: fake,
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
