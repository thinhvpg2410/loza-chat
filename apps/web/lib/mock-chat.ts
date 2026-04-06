import type { Conversation, Message } from "@/lib/types/chat";

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    title: "Nhóm dự án Loza",
    lastMessagePreview: "Mai mình sync lúc 9h nhé",
    lastMessageAt: "10:24",
    unreadCount: 3,
    isPinned: true,
    isOnline: false,
  },
  {
    id: "c2",
    title: "Minh Anh",
    lastMessagePreview: "Ok, để mình gửi file sau",
    lastMessageAt: "Hôm qua",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "c3",
    title: "CSKH Zalo",
    lastMessagePreview: "Cảm ơn bạn đã liên hệ",
    lastMessageAt: "T2",
    unreadCount: 0,
    isMuted: true,
  },
  {
    id: "c4",
    title: "Team Design",
    lastMessagePreview: "Frame mới đã up Figma",
    lastMessageAt: "T3",
    unreadCount: 12,
  },
];

const baseMessages: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      conversationId: "c1",
      body: "Chào cả nhóm, hôm nay mình rà lại backlog nhé.",
      sentAt: "09:12",
      isOwn: false,
    },
    {
      id: "m2",
      conversationId: "c1",
      body: "Ok, mình đã cập nhật ticket trên board.",
      sentAt: "09:18",
      isOwn: true,
    },
    {
      id: "m3",
      conversationId: "c1",
      body: "Mai mình sync lúc 9h nhé",
      sentAt: "10:24",
      isOwn: false,
    },
  ],
  c2: [
    {
      id: "m4",
      conversationId: "c2",
      body: "Bạn check giúp mình PR #128 được không?",
      sentAt: "08:40",
      isOwn: true,
    },
    {
      id: "m5",
      conversationId: "c2",
      body: "Ok, để mình gửi file sau",
      sentAt: "08:55",
      isOwn: false,
    },
  ],
  c3: [
    {
      id: "m6",
      conversationId: "c3",
      body: "Xin chào, chúng tôi có thể hỗ trợ gì cho bạn?",
      sentAt: "Thứ 2",
      isOwn: false,
    },
  ],
  c4: [
    {
      id: "m7",
      conversationId: "c4",
      body: "Mọi người xem giúp bản wireframe v2.",
      sentAt: "Hôm qua",
      isOwn: false,
    },
    {
      id: "m8",
      conversationId: "c4",
      body: "Frame mới đã up Figma",
      sentAt: "Hôm qua",
      isOwn: false,
    },
  ],
};

export function getMessagesForConversation(conversationId: string): Message[] {
  return baseMessages[conversationId] ?? [];
}
