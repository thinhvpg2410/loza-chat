-- Normalize legacy friendship rows so user_one_id < user_two_id (matches application invariant).
UPDATE "friendships" SET
  "user_one_id" = (LEAST("user_one_id"::text, "user_two_id"::text))::uuid,
  "user_two_id" = (GREATEST("user_one_id"::text, "user_two_id"::text))::uuid
WHERE "user_one_id"::text > "user_two_id"::text;

ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_ordered_pair";
ALTER TABLE "friendships"
ADD CONSTRAINT "friendships_ordered_pair"
CHECK ("user_one_id"::text < "user_two_id"::text);

-- At most one pending friend request per unordered pair (fixes concurrent duplicate pending inserts).
CREATE UNIQUE INDEX "friend_requests_one_pending_per_pair"
ON "friend_requests" (
  LEAST("sender_id", "receiver_id"),
  GREATEST("sender_id", "receiver_id")
)
WHERE status = 'pending';
