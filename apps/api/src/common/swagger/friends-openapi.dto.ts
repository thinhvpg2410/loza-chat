import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicUserProfileOpenApiDto } from './public-user-profile.dto';

const RelationshipStatusEnum = [
  'self',
  'none',
  'outgoing_request',
  'incoming_request',
  'friend',
  'blocked_by_me',
  'blocked_me',
] as const;

export class UserSearchResultOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  username!: string | null;

  @ApiPropertyOptional({ nullable: true })
  statusMessage!: string | null;

  @ApiProperty({
    enum: RelationshipStatusEnum,
    enumName: 'RelationshipStatus',
  })
  relationshipStatus!: (typeof RelationshipStatusEnum)[number];
}

export class UserPublicProfileResponseOpenApiDto {
  @ApiProperty({ type: PublicUserProfileOpenApiDto })
  profile!: PublicUserProfileOpenApiDto;

  @ApiProperty({
    enum: RelationshipStatusEnum,
    enumName: 'RelationshipStatus',
  })
  relationshipStatus!: (typeof RelationshipStatusEnum)[number];
}

export class UserSearchOpenApiDto {
  @ApiProperty({ type: [UserSearchResultOpenApiDto] })
  results!: UserSearchResultOpenApiDto[];
}

export class UsernameAvailableOpenApiDto {
  @ApiProperty()
  available!: boolean;
}

export class IncomingFriendRequestOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  message!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: PublicUserProfileOpenApiDto })
  sender!: PublicUserProfileOpenApiDto;
}

export class OutgoingFriendRequestOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  message!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: PublicUserProfileOpenApiDto })
  receiver!: PublicUserProfileOpenApiDto;
}

export class FriendListEntryOpenApiDto extends PublicUserProfileOpenApiDto {
  @ApiProperty({ format: 'uuid' })
  friendshipId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  friendsSince!: Date;
}

export class IncomingRequestsWrapperOpenApiDto {
  @ApiProperty({ type: [IncomingFriendRequestOpenApiDto] })
  requests!: IncomingFriendRequestOpenApiDto[];
}

export class OutgoingRequestsWrapperOpenApiDto {
  @ApiProperty({ type: [OutgoingFriendRequestOpenApiDto] })
  requests!: OutgoingFriendRequestOpenApiDto[];
}

export class FriendsListWrapperOpenApiDto {
  @ApiProperty({ type: [FriendListEntryOpenApiDto] })
  friends!: FriendListEntryOpenApiDto[];
}

export class FriendRequestCreatedOpenApiDto {
  @ApiProperty({ example: 'Friend request sent' })
  message!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;
}
