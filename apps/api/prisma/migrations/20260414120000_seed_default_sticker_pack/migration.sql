-- Default sticker pack + stickers (UUID ids must match apps/web/lib/mock-stickers.ts and apps/mobile/components/chat/mockStickers.ts).

INSERT INTO "sticker_packs" (
  "id",
  "name",
  "slug",
  "description",
  "thumbnail_url",
  "is_active",
  "sort_order",
  "created_at",
  "updated_at"
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Mặc định',
  'default',
  'Sticker emoji mặc định (Twemoji)',
  NULL,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO "stickers" (
  "id",
  "pack_id",
  "code",
  "name",
  "asset_url",
  "width",
  "height",
  "file_size",
  "is_active",
  "sort_order",
  "created_at",
  "updated_at"
) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f44d', 'Like', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png', 72, 72, NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2764', 'Heart', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png', 72, 72, NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f602', 'Haha', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png', 72, 72, NULL, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f62e', 'Wow', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f62e.png', 72, 72, NULL, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f622', 'Sad', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f622.png', 72, 72, NULL, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f64f', 'Thanks', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f64f.png', 72, 72, NULL, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f525', 'Fire', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png', 72, 72, NULL, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2728', 'Sparkle', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png', 72, 72, NULL, true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f389', 'Party', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f389.png', 72, 72, NULL, true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d489', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f44b', 'Wave', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44b.png', 72, 72, NULL, true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d48a', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f634', 'Sleep', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f634.png', 72, 72, NULL, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d48b', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f914', 'Think', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f914.png', 72, 72, NULL, true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d48c', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f600', 'Grin', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png', 72, 72, NULL, true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d48d', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f970', 'Smiling hearts', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f970.png', 72, 72, NULL, true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d48e', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '1f60d', 'Heart eyes', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png', 72, 72, NULL, true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
