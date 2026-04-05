-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('pending', 'uploaded', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('image', 'file', 'voice', 'video', 'other');

-- AlterEnum (PostgreSQL 12+: safe inside transaction)
ALTER TYPE "MessageType" ADD VALUE 'image';
ALTER TYPE "MessageType" ADD VALUE 'file';
ALTER TYPE "MessageType" ADD VALUE 'voice';
ALTER TYPE "MessageType" ADD VALUE 'video';
ALTER TYPE "MessageType" ADD VALUE 'other';

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "upload_type" "MediaKind" NOT NULL,
    "status" "UploadSessionStatus" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "conversation_id" UUID,
    "message_id" UUID,
    "uploaded_by_id" UUID NOT NULL,
    "upload_session_id" UUID,
    "storage_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "attachment_type" "MediaKind" NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "thumbnail_key" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attachments_upload_session_id_key" ON "attachments"("upload_session_id");

-- CreateIndex
CREATE INDEX "upload_sessions_user_id_status_idx" ON "upload_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "upload_sessions_expires_at_idx" ON "upload_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "attachments_upload_session_id_idx" ON "attachments"("upload_session_id");

-- CreateIndex
CREATE INDEX "attachments_message_id_idx" ON "attachments"("message_id");

-- CreateIndex
CREATE INDEX "attachments_uploaded_by_id_idx" ON "attachments"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "attachments_conversation_id_idx" ON "attachments"("conversation_id");

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_upload_session_id_fkey" FOREIGN KEY ("upload_session_id") REFERENCES "upload_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
