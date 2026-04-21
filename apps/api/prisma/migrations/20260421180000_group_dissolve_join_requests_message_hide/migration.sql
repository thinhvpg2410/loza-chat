-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "dissolved_at" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "group_join_requests" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,

    CONSTRAINT "group_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_user_hidden" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hidden_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_user_hidden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_join_requests_conversation_id_status_idx" ON "group_join_requests"("conversation_id", "status");

-- At most one pending self-join request per user per group
CREATE UNIQUE INDEX "group_join_requests_one_pending_per_user"
ON "group_join_requests" ("conversation_id", "user_id")
WHERE ("status" = 'pending');

-- CreateIndex
CREATE UNIQUE INDEX "message_user_hidden_message_id_user_id_key" ON "message_user_hidden"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "message_user_hidden_user_id_idx" ON "message_user_hidden"("user_id");

-- AddForeignKey
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_user_hidden" ADD CONSTRAINT "message_user_hidden_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_user_hidden" ADD CONSTRAINT "message_user_hidden_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
