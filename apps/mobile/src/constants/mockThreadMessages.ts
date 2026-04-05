import type { ChatMessage } from "@/types/chat";

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Newest first for inverted FlatList */
export function buildMockThreadMessages(
  conversationId: string,
  myUserId: string,
  peerUserId: string,
): ChatMessage[] {
  const base: ChatMessage[] = [
    {
      id: `${conversationId}-sys-1`,
      kind: "system",
      text: "09:48 28/03/2025",
      senderId: "system",
      createdAt: isoMinutesAgo(120),
    },
    {
      id: `${conversationId}-img-1`,
      kind: "image",
      text: "",
      senderId: peerUserId,
      imageUrl: "https://picsum.photos/id/64/400/300",
      createdAt: isoMinutesAgo(90),
    },
    {
      id: `${conversationId}-m1`,
      kind: "text",
      text: "Chào bạn, hôm nay bạn rảnh chưa?",
      senderId: peerUserId,
      createdAt: isoMinutesAgo(75),
    },
    {
      id: `${conversationId}-m2`,
      kind: "text",
      text: "Chào bạn! Mình rảnh chiều nay nhé.",
      senderId: myUserId,
      createdAt: isoMinutesAgo(70),
      status: "seen",
    },
    {
      id: `${conversationId}-m3`,
      kind: "text",
      text: "Ok vậy mình gọi lúc 3h nhé 👍",
      senderId: peerUserId,
      createdAt: isoMinutesAgo(65),
    },
    {
      id: `${conversationId}-m4`,
      kind: "text",
      text: "Oke, hẹn bạn!",
      senderId: myUserId,
      createdAt: isoMinutesAgo(60),
      status: "delivered",
    },
    {
      id: `${conversationId}-m5`,
      kind: "text",
      text: "Nhớ gửi mình file spec luôn nha.",
      senderId: peerUserId,
      createdAt: isoMinutesAgo(30),
    },
    {
      id: `${conversationId}-m6`,
      kind: "text",
      text: "Đã gửi trong nhóm drive rồi nhé.",
      senderId: myUserId,
      createdAt: isoMinutesAgo(25),
      status: "sent",
    },
    {
      id: `${conversationId}-m7`,
      kind: "text",
      text: "Thanks bạn!",
      senderId: peerUserId,
      createdAt: isoMinutesAgo(5),
    },
  ];

  return base.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
