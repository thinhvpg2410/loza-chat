/** Mock sticker packs — replace with CDN / API */
export type MockSticker = {
  id: string;
  emoji: string;
  url?: string;
};

export const MOCK_STICKERS: MockSticker[] = [
  { id: "s1", emoji: "😀", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png" },
  { id: "s2", emoji: "😂", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png" },
  { id: "s3", emoji: "🥰", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f970.png" },
  { id: "s4", emoji: "😍", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png" },
  { id: "s5", emoji: "👍", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44d.png" },
  { id: "s6", emoji: "❤️", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png" },
  { id: "s7", emoji: "🔥", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f525.png" },
  { id: "s8", emoji: "✨", url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2728.png" },
];
