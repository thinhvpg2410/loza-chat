-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('direct');

-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('member');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text');

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "type" "ConversationType" NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_id" UUID,
    "direct_user_one_id" UUID,
    "direct_user_two_id" UUID,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "client_message_id" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "reply_to_message_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ConversationMemberRole",
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_message_id" UUID,
    "last_delivered_message_id" UUID,
    "muted_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_updated_at_idx" ON "conversations" ("updated_at" DESC);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_one_id_fkey" FOREIGN KEY ("direct_user_one_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_user_two_id_fkey" FOREIGN KEY ("direct_user_two_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (last message after messages table exists)
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_last_message_id_key" ON "conversations" ("last_message_id");

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_last_delivered_message_id_fkey" FOREIGN KEY ("last_delivered_message_id") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversation_id_user_id_key" ON "conversation_members" ("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_members_user_id_idx" ON "conversation_members" ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversation_id_sender_id_client_message_id_key" ON "messages" ("conversation_id", "sender_id", "client_message_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_id_idx" ON "messages" ("conversation_id", "created_at" DESC, "id" DESC);

-- Direct 1-1: at most one conversation per unordered user pair
CREATE UNIQUE INDEX "conversations_direct_pair_unique"
ON "conversations" ("direct_user_one_id", "direct_user_two_id")
WHERE "type" = 'direct' AND "direct_user_one_id" IS NOT NULL;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_direct_ordered_pair" CHECK (
  "type" <> 'direct'::"ConversationType" OR (
    "direct_user_one_id" IS NOT NULL AND
    "direct_user_two_id" IS NOT NULL AND
    "direct_user_one_id"::text < "direct_user_two_id"::text
  )
);
