import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { UploadRulesService } from './upload-rules.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadRulesService],
  exports: [UploadsService, UploadRulesService],
})
export class UploadsModule {}
