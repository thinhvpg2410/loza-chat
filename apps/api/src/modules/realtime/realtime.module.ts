import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { FriendsModule } from '../friends/friends.module';
import { GroupsModule } from '../groups/groups.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';
import { SocketAuthService } from './socket-auth.service';
import { TypingStateService } from './typing-state.service';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    MessagesModule,
    FriendsModule,
    GroupsModule,
  ],
  providers: [
    ChatGateway,
    SocketAuthService,
    PresenceService,
    TypingStateService,
  ],
})
export class RealtimeModule {}
