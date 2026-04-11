export type PresignedUploadInstructions = {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
};

export type CreatePresignedPutParams = {
  bucket: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
  /** Set for mock storage so the presigned URL targets PUT /uploads/mock-upload/:id */
  uploadSessionId?: string;
};

export type VerifyObjectParams = {
  bucket: string;
  key: string;
  expectedContentType: string;
  expectedSizeBytes: bigint;
};

export abstract class ObjectStoragePort {
  abstract createPresignedPut(
    params: CreatePresignedPutParams,
  ): Promise<PresignedUploadInstructions>;

  abstract verifyObjectPresent(params: VerifyObjectParams): Promise<void>;
}
