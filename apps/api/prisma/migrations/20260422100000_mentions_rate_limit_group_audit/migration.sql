CREATE TABLE "message_mentions" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "mentioned_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_mentions_message_id_mentioned_user_id_key"
ON "message_mentions"("message_id", "mentioned_user_id");

CREATE INDEX "message_mentions_mentioned_user_id_created_at_id_idx"
ON "message_mentions"("mentioned_user_id", "created_at" DESC, "id" DESC);

CREATE INDEX "message_mentions_conversation_id_mentioned_user_id_created_at_id_idx"
ON "message_mentions"("conversation_id", "mentioned_user_id", "created_at" DESC, "id" DESC);

ALTER TABLE "message_mentions"
ADD CONSTRAINT "message_mentions_message_id_fkey"
FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_mentions"
ADD CONSTRAINT "message_mentions_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_mentions"
ADD CONSTRAINT "message_mentions_mentioned_user_id_fkey"
FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "conversation_spam_rate_limits" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "window_start_sec" INTEGER NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversation_spam_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversation_spam_rate_limits_user_id_conversation_id_action_wi_key"
ON "conversation_spam_rate_limits"("user_id", "conversation_id", "action", "window_start_sec");

CREATE INDEX "conversation_spam_rate_limits_user_id_conversation_id_action_up_idx"
ON "conversation_spam_rate_limits"("user_id", "conversation_id", "action", "updated_at");

ALTER TABLE "conversation_spam_rate_limits"
ADD CONSTRAINT "conversation_spam_rate_limits_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_spam_rate_limits"
ADD CONSTRAINT "conversation_spam_rate_limits_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_audit_logs" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_user_id" TEXT,
  "payload_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "group_audit_logs_conversation_id_created_at_idx"
ON "group_audit_logs"("conversation_id", "created_at" DESC);

CREATE INDEX "group_audit_logs_actor_user_id_created_at_idx"
ON "group_audit_logs"("actor_user_id", "created_at" DESC);

ALTER TABLE "group_audit_logs"
ADD CONSTRAINT "group_audit_logs_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_audit_logs"
ADD CONSTRAINT "group_audit_logs_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_audit_logs"
ADD CONSTRAINT "group_audit_logs_target_user_id_fkey"
FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
