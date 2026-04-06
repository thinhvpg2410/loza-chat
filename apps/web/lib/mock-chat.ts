import type { Conversation, ConversationThread, Message } from "@/lib/types/chat";

const DAY1 = "2026-04-05";
const DAY2 = "2026-04-06";

function iso(day: string, time: string): string {
  return `${day}T${time}:00`;
}

const IMG_SAMPLE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80&auto=format&fit=crop";

export const mockThreads: ConversationThread[] = [
  {
    conversation: {
      id: "c1",
      title: "Nhóm dự án Loza",
      lastMessagePreview: "Mai mình sync lúc 9h nhé",
      lastMessageAt: "10:24",
      unreadCount: 3,
      isPinned: true,
      isOnline: false,
      lastSeenLabel: "Một số thành viên đang hoạt động",
    },
    messages: [
      {
        id: "m0",
        conversationId: "c1",
        kind: "system",
        body: "Lan đã thêm Bình vào nhóm.",
        sentAt: "09:00",
        createdAt: iso(DAY2, "09:00"),
        isOwn: false,
      },
      {
        id: "m1",
        conversationId: "c1",
        kind: "text",
        body: "Chào cả nhóm, hôm nay mình rà lại backlog nhé.",
        sentAt: "09:12",
        createdAt: iso(DAY2, "09:12"),
        isOwn: false,
        reactions: [
          { emoji: "👍", count: 2, viewerReacted: false },
          { emoji: "❤️", count: 1, viewerReacted: false },
        ],
      },
      {
        id: "m1b",
        conversationId: "c1",
        kind: "image",
        imageUrl: IMG_SAMPLE,
        alt: "Landscape",
        sentAt: "09:14",
        createdAt: iso(DAY2, "09:14"),
        isOwn: false,
        loading: false,
      },
      {
        id: "m2",
        conversationId: "c1",
        kind: "text",
        body: "Ok, mình đã cập nhật ticket trên board.",
        sentAt: "09:18",
        createdAt: iso(DAY2, "09:18"),
        isOwn: true,
        replyTo: {
          messageId: "m1",
          snippet: "Chào cả nhóm, hôm nay mình rà lại backlog nhé.",
          isOwn: false,
        },
      },
      {
        id: "m2b",
        conversationId: "c1",
        kind: "file",
        fileName: "backlog-sprint12.xlsx",
        fileSizeBytes: 245760,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sentAt: "09:19",
        createdAt: iso(DAY2, "09:19"),
        isOwn: true,
      },
      {
        id: "m2c",
        conversationId: "c1",
        kind: "sticker",
        stickerId: "s3",
        emoji: "😂",
        sentAt: "09:20",
        createdAt: iso(DAY2, "09:20"),
        isOwn: false,
      },
      {
        id: "m3",
        conversationId: "c1",
        kind: "text",
        body: "Mai mình sync lúc 9h nhé",
        sentAt: "10:24",
        createdAt: iso(DAY2, "10:24"),
        isOwn: false,
        reactions: [{ emoji: "👍", count: 1, viewerReacted: true }],
      },
    ],
  },
  {
    conversation: {
      id: "c2",
      title: "Minh Anh",
      lastMessagePreview: "Ok, để mình gửi file sau",
      lastMessageAt: "Hôm qua",
      unreadCount: 0,
      isOnline: true,
    },
    messages: [
      {
        id: "m4",
        conversationId: "c2",
        kind: "text",
        body: "Bạn check giúp mình PR #128 được không?",
        sentAt: "08:40",
        createdAt: iso(DAY2, "08:40"),
        isOwn: true,
      },
      {
        id: "m5",
        conversationId: "c2",
        kind: "text",
        body: "Ok, để mình gửi file sau",
        sentAt: "08:55",
        createdAt: iso(DAY2, "08:55"),
        isOwn: false,
      },
    ],
  },
  {
    conversation: {
      id: "c3",
      title: "CSKH Loza",
      lastMessagePreview: "Cảm ơn bạn đã liên hệ",
      lastMessageAt: "T2",
      unreadCount: 0,
      isMuted: true,
      isOnline: false,
      lastSeenLabel: "Thường trả lời trong vài phút",
    },
    messages: [
      {
        id: "m6",
        conversationId: "c3",
        kind: "text",
        body: "Xin chào, chúng tôi có thể hỗ trợ gì cho bạn?",
        sentAt: "14:20",
        createdAt: iso(DAY1, "14:20"),
        isOwn: false,
      },
    ],
  },
  {
    conversation: {
      id: "c4",
      title: "Team Design",
      lastMessagePreview: "Frame mới đã up Figma",
      lastMessageAt: "T3",
      unreadCount: 12,
      isOnline: false,
      lastSeenLabel: "Hoạt động 2 giờ trước",
    },
    messages: [
      {
        id: "m7",
        conversationId: "c4",
        kind: "text",
        body: "Mọi người xem giúp bản wireframe v2.",
        sentAt: "16:10",
        createdAt: iso(DAY1, "16:10"),
        isOwn: false,
      },
      {
        id: "m8",
        conversationId: "c4",
        kind: "text",
        body: "Frame mới đã up Figma",
        sentAt: "17:02",
        createdAt: iso(DAY1, "17:02"),
        isOwn: false,
      },
    ],
  },
];

export const mockConversations: Conversation[] = mockThreads.map((t) => t.conversation);

const messagesById: Record<string, Message[]> = Object.fromEntries(
  mockThreads.map((t) => [t.conversation.id, t.messages]),
);

export function getMessagesForConversation(conversationId: string): Message[] {
  return messagesById[conversationId] ?? [];
}

export function getConversationById(id: string): Conversation | undefined {
  return mockThreads.find((t) => t.conversation.id === id)?.conversation;
}
