import type { PublicUserProfile } from '../../../common/types/public-user-profile';

export type IncomingFriendRequestView = {
  id: string;
  message: string | null;
  createdAt: Date;
  sender: PublicUserProfile;
};

export type OutgoingFriendRequestView = {
  id: string;
  message: string | null;
  createdAt: Date;
  receiver: PublicUserProfile;
};
