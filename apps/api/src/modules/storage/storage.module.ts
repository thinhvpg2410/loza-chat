import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import { MockObjectStorageService } from './mock-object-storage.service';
import { ObjectStoragePort } from './object-storage.port';
import { S3ObjectStorageService } from './s3-object-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: ObjectStoragePort,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => {
        const storage = config.get('storage', { infer: true });
        if (storage.mock) {
          return new MockObjectStorageService(config);
        }
        if (
          !storage.bucket ||
          !storage.accessKeyId ||
          !storage.secretAccessKey
        ) {
          throw new Error(
            'S3 storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY or use STORAGE_MOCK=true.',
          );
        }
        return new S3ObjectStorageService(config);
      },
    },
  ],
  exports: [ObjectStoragePort],
})
export class StorageModule {}
