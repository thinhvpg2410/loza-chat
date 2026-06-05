import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DevicesModule } from '../devices/devices.module';
import { FriendsModule } from '../friends/friends.module';
import { GroupsModule } from '../groups/groups.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';
import { CallService } from './call.service';
import { PresenceService } from './presence.service';
import { PushNotificationService } from './push-notification.service';
import { SocketAuthService } from './socket-auth.service';
import { TypingStateService } from './typing-state.service';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    DevicesModule,
    MessagesModule,
    FriendsModule,
    GroupsModule,
  ],
  providers: [
    ChatGateway,
    CallService,
    PushNotificationService,
    SocketAuthService,
    PresenceService,
    TypingStateService,
  ],
  exports: [PushNotificationService],
})
export class RealtimeModule {}
