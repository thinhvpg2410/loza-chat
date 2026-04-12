import type { PublicUserProfile } from '../../../common/types/public-user-profile';
import type { RelationshipStatus } from '../../friends/types/relationship-status';

export type UserPublicProfileResponse = {
  profile: PublicUserProfile;
  relationshipStatus: RelationshipStatus;
};
