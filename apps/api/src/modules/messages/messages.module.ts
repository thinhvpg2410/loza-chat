import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { UploadsModule } from '../uploads/uploads.module';
import { MessageReceiptsService } from './message-receipts.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule, forwardRef(() => ConversationsModule), UploadsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageReceiptsService],
  exports: [MessagesService, MessageReceiptsService],
})
export class MessagesModule {}
