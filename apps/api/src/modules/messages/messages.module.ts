import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { GroupsModule } from '../groups/groups.module';
import { StickersModule } from '../stickers/stickers.module';
import { UploadsModule } from '../uploads/uploads.module';
import { MessageDomainEventsService } from './message-domain-events.service';
import { MessageReceiptsService } from './message-receipts.service';
import { MessageReactionsController } from './message-reactions.controller';
import { MessagesController } from './messages.controller';
import { ConversationRateLimitService } from './conversation-rate-limit.service';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ConversationsModule),
    forwardRef(() => GroupsModule),
    UploadsModule,
    StickersModule,
  ],
  controllers: [MessagesController, MessageReactionsController],
  providers: [
    MessagesService,
    MessageReceiptsService,
    MessageDomainEventsService,
    ConversationRateLimitService,
  ],
  exports: [MessagesService, MessageReceiptsService, MessageDomainEventsService],
})
export class MessagesModule {}
