-- Phase 8: group conversations, roles, system messages

ALTER TYPE "ConversationType" ADD VALUE 'group';

ALTER TYPE "ConversationMemberRole" ADD VALUE 'owner';
ALTER TYPE "ConversationMemberRole" ADD VALUE 'admin';

ALTER TYPE "MessageType" ADD VALUE 'system';

ALTER TABLE "conversations" ADD COLUMN "title" TEXT;
ALTER TABLE "conversations" ADD COLUMN "avatar_url" TEXT;

ALTER TABLE "messages" ADD COLUMN "metadata_json" JSONB;
