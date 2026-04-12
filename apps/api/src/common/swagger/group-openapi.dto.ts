import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationMemberRole } from '@prisma/client';
import { PublicUserProfileOpenApiDto } from './public-user-profile.dto';

export class GroupMemberOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    enum: ConversationMemberRole,
    enumName: 'ConversationMemberRole',
  })
  role!: ConversationMemberRole;

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

  @ApiProperty({ type: [GroupMemberOpenApiDto] })
  members!: GroupMemberOpenApiDto[];
}

export class GroupDetailWrapperOpenApiDto {
  @ApiProperty({ type: GroupDetailOpenApiDto })
  group!: GroupDetailOpenApiDto;
}
