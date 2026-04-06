import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { StickersModule } from '../stickers/stickers.module';
import { UploadsModule } from '../uploads/uploads.module';
import { MessageDomainEventsService } from './message-domain-events.service';
import { MessageReceiptsService } from './message-receipts.service';
import { MessageReactionsController } from './message-reactions.controller';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ConversationsModule),
    UploadsModule,
    StickersModule,
  ],
  controllers: [MessagesController, MessageReactionsController],
  providers: [MessagesService, MessageReceiptsService, MessageDomainEventsService],
  exports: [MessagesService, MessageReceiptsService, MessageDomainEventsService],
})
export class MessagesModule {}
