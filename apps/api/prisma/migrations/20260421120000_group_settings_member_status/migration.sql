-- CreateEnum
CREATE TYPE "ConversationMemberStatus" AS ENUM ('pending', 'active');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "group_settings_json" JSONB;

-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN "status" "ConversationMemberStatus" NOT NULL DEFAULT 'active';
