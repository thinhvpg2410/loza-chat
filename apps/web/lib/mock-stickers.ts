export type StickerItem = {
  id: string;
  emoji: string;
  label: string;
};

/**
 * Mock sticker pack for picker UI (emoji-based, no asset pipeline).
 * Ids are UUID v4 and must match seeded rows in
 * `apps/api/prisma/migrations/20260414120000_seed_default_sticker_pack/migration.sql`.
 */
export const mockStickerPack: StickerItem[] = [
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d480", emoji: "👍", label: "Like" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d481", emoji: "❤️", label: "Heart" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d482", emoji: "😂", label: "Haha" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d483", emoji: "😮", label: "Wow" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d484", emoji: "😢", label: "Sad" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d485", emoji: "🙏", label: "Thanks" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d486", emoji: "🔥", label: "Fire" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d487", emoji: "✨", label: "Sparkle" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d488", emoji: "🎉", label: "Party" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d489", emoji: "👋", label: "Wave" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d48a", emoji: "😴", label: "Sleep" },
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d48b", emoji: "🤔", label: "Think" },
];

export const quickReactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
