-- One direct row per canonical pair (app sets direct_user_one_id < direct_user_two_id via sortUserPair).
CREATE UNIQUE INDEX "conversations_direct_pair_uidx"
ON "conversations" ("direct_user_one_id", "direct_user_two_id")
WHERE "type" = 'direct'
  AND "direct_user_one_id" IS NOT NULL
  AND "direct_user_two_id" IS NOT NULL;
