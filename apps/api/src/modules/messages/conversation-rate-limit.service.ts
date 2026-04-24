import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ActionPolicy = {
  windowSec: number;
  limit: number;
};

const ACTION_POLICIES: Record<'text' | 'reaction' | 'voice', ActionPolicy> = {
  text: { windowSec: 10, limit: 20 },
  reaction: { windowSec: 10, limit: 40 },
  voice: { windowSec: 60, limit: 6 },
};

@Injectable()
export class ConversationRateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAndConsume(
    userId: string,
    conversationId: string,
    action: keyof typeof ACTION_POLICIES,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const policy = ACTION_POLICIES[action];
    const windowStartSec = Math.floor(Date.now() / 1000 / policy.windowSec) * policy.windowSec;
    const db = tx ?? this.prisma;
    await db.$executeRaw`
      INSERT INTO "conversation_spam_rate_limits"
        ("id","user_id","conversation_id","action","window_start_sec","count","created_at","updated_at")
      VALUES
        (gen_random_uuid()::text, ${userId}, ${conversationId}, ${action}, ${windowStartSec}, 1, NOW(), NOW())
      ON CONFLICT ("user_id","conversation_id","action","window_start_sec")
      DO UPDATE SET
        "count" = "conversation_spam_rate_limits"."count" + 1,
        "updated_at" = NOW()
    `;
    const rows = await db.$queryRaw<Array<{ count: number }>>`
      SELECT "count"
      FROM "conversation_spam_rate_limits"
      WHERE "user_id" = ${userId}
        AND "conversation_id" = ${conversationId}
        AND "action" = ${action}
        AND "window_start_sec" = ${windowStartSec}
      LIMIT 1
    `;
    const count = rows[0]?.count ?? 0;
    if (count > policy.limit) {
      throw new HttpException(
        `Too many ${action} actions in this conversation. Please retry later.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
