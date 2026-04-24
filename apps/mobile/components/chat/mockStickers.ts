/** Mock sticker packs — replace with CDN / API */
export type MockSticker = {
  id: string;
  emoji: string;
  url?: string;
};

/**
 * Ids are UUID v4 and must match seeded rows in
 * `apps/api/prisma/migrations/20260414120000_seed_default_sticker_pack/migration.sql`.
 */
export const MOCK_STICKERS: MockSticker[] = [
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d48c", emoji: "😀", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d482", emoji: "😂", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d48d", emoji: "🥰", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f970.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d48e", emoji: "😍", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d480", emoji: "👍", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d481", emoji: "❤️", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d486", emoji: "🔥", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d487", emoji: "✨", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png" },
];
