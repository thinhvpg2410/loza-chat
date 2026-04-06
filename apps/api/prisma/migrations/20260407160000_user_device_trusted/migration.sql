-- AlterTable
ALTER TABLE "user_devices" ADD COLUMN "is_trusted" BOOLEAN NOT NULL DEFAULT false;

-- Trust existing devices so current users are not blocked after deploy
UPDATE "user_devices" SET "is_trusted" = true;
