-- CreateEnum
CREATE TYPE "QrLoginSessionStatus" AS ENUM ('pending', 'scanned', 'approved', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "qr_login_sessions" (
    "id" TEXT NOT NULL,
    "public_token" TEXT NOT NULL,
    "status" "QrLoginSessionStatus" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "web_device_id" TEXT NOT NULL,
    "web_platform" TEXT NOT NULL,
    "web_app_version" TEXT NOT NULL,
    "web_device_name" TEXT,
    "scanned_by_user_id" TEXT,
    "scanned_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "access_token_for_delivery" TEXT,
    "refresh_token_for_delivery" TEXT,
    "tokens_delivered_at" TIMESTAMP(3),

    CONSTRAINT "qr_login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qr_login_sessions_public_token_key" ON "qr_login_sessions"("public_token");

-- CreateIndex
CREATE INDEX "qr_login_sessions_expires_at_idx" ON "qr_login_sessions"("expires_at");
