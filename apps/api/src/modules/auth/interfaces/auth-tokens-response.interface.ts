import type { User } from '@prisma/client';

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  user: Pick<User, 'id' | 'phone' | 'name' | 'avatar' | 'createdAt'>;
}
