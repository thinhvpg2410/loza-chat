import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FriendsModule } from '../friends/friends.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationMembershipService } from './conversation-membership.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [AuthModule, FriendsModule, forwardRef(() => MessagesModule)],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationMembershipService],
  exports: [ConversationsService, ConversationMembershipService],
})
export class ConversationsModule {}
