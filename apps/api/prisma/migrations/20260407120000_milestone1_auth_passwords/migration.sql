-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AlterTable
ALTER TABLE "otp_requests" ALTER COLUMN "phone_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "otp_requests" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateIndex
CREATE INDEX "otp_requests_email_created_at_idx" ON "otp_requests"("email", "created_at");
