-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'sticker';

-- CreateTable
CREATE TABLE "sticker_packs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticker_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stickers" (
    "id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "asset_url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "file_size" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recent_stickers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sticker_id" UUID NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "use_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_recent_stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sticker_packs_slug_key" ON "sticker_packs"("slug");

-- CreateIndex
CREATE INDEX "sticker_packs_is_active_sort_order_idx" ON "sticker_packs"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "stickers_pack_id_is_active_sort_order_idx" ON "stickers"("pack_id", "is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "sticker_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "user_recent_stickers_user_id_sticker_id_key" ON "user_recent_stickers"("user_id", "sticker_id");

-- CreateIndex
CREATE INDEX "user_recent_stickers_user_id_last_used_at_idx" ON "user_recent_stickers"("user_id", "last_used_at" DESC);

-- AddForeignKey
ALTER TABLE "user_recent_stickers" ADD CONSTRAINT "user_recent_stickers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recent_stickers" ADD CONSTRAINT "user_recent_stickers_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_reaction_key" ON "message_reactions"("message_id", "user_id", "reaction");

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "message_reactions_user_id_idx" ON "message_reactions"("user_id");

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "sticker_id" UUID;

-- CreateIndex
CREATE INDEX "messages_sticker_id_idx" ON "messages"("sticker_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
