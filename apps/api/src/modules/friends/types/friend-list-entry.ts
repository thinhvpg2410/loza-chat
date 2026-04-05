import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export type FriendListEntry = PublicUserProfile & {
  friendshipId: string;
  friendsSince: Date;
};
