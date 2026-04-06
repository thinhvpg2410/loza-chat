import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { FriendsModule } from '../friends/friends.module';
import { GroupDomainEventsService } from './group-domain-events.service';
import { GroupPermissionsService } from './group-permissions.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [AuthModule, FriendsModule, ConversationsModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupPermissionsService, GroupDomainEventsService],
  exports: [GroupDomainEventsService],
})
export class GroupsModule {}
