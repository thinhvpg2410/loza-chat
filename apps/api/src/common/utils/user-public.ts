import type { User } from '@prisma/client';

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const rest: Partial<User> = { ...user };
  delete rest.passwordHash;
  return rest as PublicUser;
}
