import type { User } from '@prisma/client';

/** Safe fields for search, friend lists, and request payloads (no phone, tokens, etc.). */
export type PublicUserProfile = Pick<
  User,
  'id' | 'displayName' | 'avatarUrl' | 'username' | 'statusMessage'
>;

export function toPublicUserProfile(user: User): PublicUserProfile {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    username: user.username,
    statusMessage: user.statusMessage,
  };
}
