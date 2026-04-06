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
 * Rich mock thread — grouped sequences, delivery/seen, multi-day for separators.
 * Swap for API: same `ChatRoomMessage[]` shape.
 */
const THREAD_EM: ChatRoomMessage[] = [
  {
    id: "m1",
    conversationId: "1",
    senderRole: "peer",
    body: "Anh ơi em gửi file trong drive rồi nhé",
    createdAt: isoDaysAgoAt(1, 21, 12),
  },
  {
    id: "m2",
    conversationId: "1",
    senderRole: "peer",
    body: "Link ở folder ‘Dự án Q1’ ạ",
    createdAt: isoDaysAgoAt(1, 21, 13),
  },
  {
    id: "m3",
    conversationId: "1",
    senderRole: "me",
    body: "Ok em, anh xem ngay",
    createdAt: isoDaysAgoAt(1, 21, 18),
    delivery: "seen",
  },
  {
    id: "m4",
    conversationId: "1",
    senderRole: "me",
    body: "Đã tải về rồi, cảm ơn em",
    createdAt: isoDaysAgoAt(1, 21, 19),
    delivery: "seen",
  },
  {
    id: "m5",
    conversationId: "1",
    senderRole: "peer",
    body: "Dạ ạ 💛",
    createdAt: isoDaysAgoAt(1, 21, 20),
  },
  {
    id: "m6",
    conversationId: "1",
    senderRole: "me",
    body: "Mai mình sync 10h nhé",
    createdAt: isoMinutesAgo(380),
    delivery: "delivered",
  },
  {
    id: "m7",
    conversationId: "1",
    senderRole: "me",
    body: "Anh gửi thêm checklist trong doc",
    createdAt: isoMinutesAgo(378),
    delivery: "delivered",
  },
  {
    id: "m8",
    conversationId: "1",
    senderRole: "peer",
    body: "Ok nhé anh, em gửi file sau",
    createdAt: isoMinutesAgo(12),
  },
  {
    id: "m9",
    conversationId: "1",
    senderRole: "peer",
    body: "Em đang chỉnh lại slide cuối",
    createdAt: isoMinutesAgo(10),
  },
  {
    id: "m10",
    conversationId: "1",
    senderRole: "me",
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
    body: "Tài liệu đã được cập nhật.",
    createdAt: isoMinutesAgo(120),
  },
  {
    id: "d2",
    conversationId: "2",
    senderRole: "peer",
    body: "Bạn có thể tải từ mục Đã nhận.",
    createdAt: isoMinutesAgo(118),
  },
  {
    id: "d3",
    conversationId: "2",
    senderRole: "me",
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
    body: "Xin chào! Đây là cuộc trò chuyện mẫu.",
    createdAt: isoMinutesAgo(30),
  },
  {
    id: "x2",
    conversationId: "default",
    senderRole: "me",
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
