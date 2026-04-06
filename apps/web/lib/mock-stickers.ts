export type StickerItem = {
  id: string;
  emoji: string;
  label: string;
};

/** Mock sticker pack for picker UI (emoji-based, no asset pipeline). */
export const mockStickerPack: StickerItem[] = [
  { id: "s1", emoji: "👍", label: "Like" },
  { id: "s2", emoji: "❤️", label: "Heart" },
  { id: "s3", emoji: "😂", label: "Haha" },
  { id: "s4", emoji: "😮", label: "Wow" },
  { id: "s5", emoji: "😢", label: "Sad" },
  { id: "s6", emoji: "🙏", label: "Thanks" },
  { id: "s7", emoji: "🔥", label: "Fire" },
  { id: "s8", emoji: "✨", label: "Sparkle" },
  { id: "s9", emoji: "🎉", label: "Party" },
  { id: "s10", emoji: "👋", label: "Wave" },
  { id: "s11", emoji: "😴", label: "Sleep" },
  { id: "s12", emoji: "🤔", label: "Think" },
];

export const quickReactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
