import type { ChatRoomMessage } from "./types";

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function isoDaysAgoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Rich mock — text, image, file, sticker, reply, reactions.
 */
const THREAD_EM: ChatRoomMessage[] = [
  {
    id: "m1",
    conversationId: "1",
    senderRole: "peer",
    kind: "text",
    body: "Anh ơi em gửi file trong drive rồi nhé",
    createdAt: isoDaysAgoAt(1, 21, 12),
  },
  {
    id: "m1b",
    conversationId: "1",
    senderRole: "peer",
    kind: "image",
    imageUrl: "https://picsum.photos/id/64/600/400",
    imageWidth: 600,
    imageHeight: 400,
    createdAt: isoDaysAgoAt(1, 21, 12),
  },
  {
    id: "m2",
    conversationId: "1",
    senderRole: "peer",
    kind: "text",
    body: "Link ở folder ‘Dự án Q1’ ạ",
    createdAt: isoDaysAgoAt(1, 21, 13),
  },
  {
    id: "m2b",
    conversationId: "1",
    senderRole: "peer",
    kind: "file",
    file: { name: "Bang_chon_Q1.pdf", sizeBytes: 842_000, mime: "application/pdf" },
    createdAt: isoDaysAgoAt(1, 21, 14),
  },
  {
    id: "m3",
    conversationId: "1",
    senderRole: "me",
    kind: "text",
    body: "Ok em, anh xem ngay",
    createdAt: isoDaysAgoAt(1, 21, 18),
    delivery: "seen",
    replyTo: { id: "m1", senderLabel: "Em 🫶", preview: "Anh ơi em gửi file trong drive rồi nhé" },
    reactions: [{ emoji: "❤️", count: 1, reactedByMe: false }],
  },
  {
    id: "m4",
    conversationId: "1",
    senderRole: "me",
    kind: "text",
    body: "Đã tải về rồi, cảm ơn em",
    createdAt: isoDaysAgoAt(1, 21, 19),
    delivery: "seen",
    reactions: [
      { emoji: "👍", count: 2, reactedByMe: true },
      { emoji: "❤️", count: 1, reactedByMe: false },
    ],
  },
  {
    id: "m5",
    conversationId: "1",
    senderRole: "peer",
    kind: "sticker",
    stickerEmoji: "🥰",
    stickerUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f970.png",
    createdAt: isoDaysAgoAt(1, 21, 20),
  },
  {
    id: "m6",
    conversationId: "1",
    senderRole: "me",
    kind: "text",
    body: "Mai mình sync 10h nhé",
    createdAt: isoMinutesAgo(380),
    delivery: "delivered",
  },
  {
    id: "m7",
    conversationId: "1",
    senderRole: "me",
    kind: "text",
    body: "Anh gửi thêm checklist trong doc",
    createdAt: isoMinutesAgo(378),
    delivery: "delivered",
  },
  {
    id: "m8",
    conversationId: "1",
    senderRole: "peer",
    kind: "text",
    body: "Ok nhé anh, em gửi file sau",
    createdAt: isoMinutesAgo(12),
  },
  {
    id: "m9",
    conversationId: "1",
    senderRole: "peer",
    kind: "text",
    body: "Em đang chỉnh lại slide cuối",
    createdAt: isoMinutesAgo(10),
  },
  {
    id: "m10",
    conversationId: "1",
    senderRole: "me",
    kind: "text",
    body: "👍",
    createdAt: isoMinutesAgo(8),
    delivery: "seen",
  },
];

const THREAD_DOCS: ChatRoomMessage[] = [
  {
    id: "d1",
    conversationId: "2",
    senderRole: "peer",
    kind: "text",
    body: "Tài liệu đã được cập nhật.",
    createdAt: isoMinutesAgo(120),
  },
  {
    id: "d2",
    conversationId: "2",
    senderRole: "peer",
    kind: "file",
    file: { name: "Hop_dong.pdf", sizeBytes: 1_024_000, mime: "application/pdf" },
    createdAt: isoMinutesAgo(118),
  },
  {
    id: "d3",
    conversationId: "2",
    senderRole: "me",
    kind: "text",
    body: "Ok, cảm ơn bạn",
    createdAt: isoMinutesAgo(60),
    delivery: "seen",
  },
];

const THREAD_DEFAULT: ChatRoomMessage[] = [
  {
    id: "x1",
    conversationId: "default",
    senderRole: "peer",
    kind: "text",
    body: "Xin chào! Đây là cuộc trò chuyện mẫu.",
    createdAt: isoMinutesAgo(30),
  },
  {
    id: "x2",
    conversationId: "default",
    senderRole: "me",
    kind: "text",
    body: "Chào bạn 👋",
    createdAt: isoMinutesAgo(28),
    delivery: "delivered",
  },
];

const BY_CONVERSATION: Record<string, ChatRoomMessage[]> = {
  "1": THREAD_EM,
  "2": THREAD_DOCS,
};

export function getMockThreadMessages(conversationId: string): ChatRoomMessage[] {
  const direct = BY_CONVERSATION[conversationId];
  if (direct) return direct;
  return THREAD_DEFAULT.map((m) => ({
    ...m,
    conversationId,
    id: `${conversationId}-${m.id}`,
  }));
}
