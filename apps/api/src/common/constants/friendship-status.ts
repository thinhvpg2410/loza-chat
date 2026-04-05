export const FriendshipStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
} as const;

export type FriendshipStatusValue =
  (typeof FriendshipStatus)[keyof typeof FriendshipStatus];
