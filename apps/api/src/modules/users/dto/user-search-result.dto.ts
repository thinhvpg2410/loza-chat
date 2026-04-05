import type { RelationshipStatus } from '../../friends/types/relationship-status';

export type UserSearchPublic = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
  relationshipStatus: RelationshipStatus;
};
