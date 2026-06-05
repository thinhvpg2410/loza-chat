-- Add push notification token fields to user_devices
ALTER TABLE "user_devices" ADD COLUMN "push_token" TEXT;
ALTER TABLE "user_devices" ADD COLUMN "push_platform" TEXT;
