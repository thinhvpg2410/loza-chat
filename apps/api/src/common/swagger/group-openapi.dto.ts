import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationMemberRole, ConversationMemberStatus } from '@prisma/client';
import { PublicUserProfileOpenApiDto } from './public-user-profile.dto';

export class GroupSettingsOpenApiDto {
  @ApiProperty()
  onlyAdminsCanPost!: boolean;

  @ApiProperty()
  joinApprovalRequired!: boolean;

  @ApiProperty()
  onlyAdminsCanAddMembers!: boolean;

  @ApiProperty()
  onlyAdminsCanRemoveMembers!: boolean;

  @ApiProperty({
    description:
      'When true, owner and admins may recall other members’ messages (not the leader’s).',
  })
  moderatorsCanRecallMessages!: boolean;
}

export class GroupMemberOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    enum: ConversationMemberRole,
    enumName: 'ConversationMemberRole',
  })
  role!: ConversationMemberRole;

  @ApiProperty({
    enum: ConversationMemberStatus,
    enumName: 'ConversationMemberStatus',
  })
  status!: ConversationMemberStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: Date;

  @ApiProperty({ type: PublicUserProfileOpenApiDto })
  user!: PublicUserProfileOpenApiDto;
}

export class GroupDetailOpenApiDto {
  @ApiProperty({ format: 'uuid', description: 'Group conversation id' })
  conversationId!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  createdById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({
    enum: ConversationMemberRole,
    enumName: 'ConversationMemberRole',
  })
  myRole!: ConversationMemberRole;

  @ApiProperty({
    enum: ConversationMemberStatus,
    enumName: 'ConversationMemberStatus',
  })
  myStatus!: ConversationMemberStatus;

  @ApiProperty({ type: GroupSettingsOpenApiDto })
  settings!: GroupSettingsOpenApiDto;

  @ApiProperty({ type: [GroupMemberOpenApiDto] })
  members!: GroupMemberOpenApiDto[];

  @ApiProperty({
    type: [GroupMemberOpenApiDto],
    description: 'Owner/admin only: pending join requests',
  })
  pendingMembers!: GroupMemberOpenApiDto[];
}

export class GroupDetailWrapperOpenApiDto {
  @ApiProperty({ type: GroupDetailOpenApiDto })
  group!: GroupDetailOpenApiDto;
}
