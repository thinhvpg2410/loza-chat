import type { User } from '@prisma/client';

export interface ChatSocketData {
  user?: User;
  deviceId?: string;
  correlationId?: string;
  /** Conversations this socket successfully joined (for typing cleanup on disconnect). */
  conversationRooms?: Set<string>;
}
