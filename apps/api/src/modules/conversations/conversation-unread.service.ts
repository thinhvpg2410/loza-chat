import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConversationUnreadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unread = non-deleted messages from others strictly after the member's
   * `lastReadMessageId` in (createdAt, id) order. Null last read counts all peer messages.
   */
  async countsForConversations(
    userId: string,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (conversationIds.length === 0) {
      return map;
    }

    const rows = await this.prisma.$queryRaw<
      { conversation_id: string; cnt: bigint }[]
    >`
      SELECT m.conversation_id, COUNT(*)::bigint AS cnt
      FROM messages m
      INNER JOIN conversation_members cm
        ON cm.conversation_id = m.conversation_id AND cm.user_id = ${userId}::uuid
      LEFT JOIN messages lr ON lr.id = cm.last_read_message_id
      WHERE m.deleted_at IS NULL
        AND m.sender_id <> ${userId}::uuid
        AND m.conversation_id IN (${Prisma.join(
          conversationIds.map((id) => Prisma.sql`${id}::uuid`),
        )})
        AND (
          cm.last_read_message_id IS NULL
          OR m.created_at > lr.created_at
          OR (m.created_at = lr.created_at AND m.id > lr.id)
        )
      GROUP BY m.conversation_id
    `;

    for (const row of rows) {
      map.set(row.conversation_id, Number(row.cnt));
    }
    return map;
  }

  async countForConversation(
    userId: string,
    conversationId: string,
  ): Promise<number> {
    const map = await this.countsForConversations(userId, [conversationId]);
    return map.get(conversationId) ?? 0;
  }
}
