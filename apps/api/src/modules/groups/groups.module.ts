import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { FriendsModule } from '../friends/friends.module';
import { MessagesModule } from '../messages/messages.module';
import { GroupDomainEventsService } from './group-domain-events.service';
import { GroupPermissionsService } from './group-permissions.service';
import { GroupPostPolicyService } from './group-post-policy.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    AuthModule,
    FriendsModule,
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessagesModule),
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupPermissionsService,
    GroupDomainEventsService,
    GroupPostPolicyService,
  ],
  exports: [
    GroupDomainEventsService,
    GroupPostPolicyService,
    GroupPermissionsService,
  ],
})
export class GroupsModule {}
