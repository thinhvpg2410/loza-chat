import type { MockConversation } from "@/constants/mockData";

export type ApiConversationListItem = {
  conversationId: string;
  type: "direct" | "group";
  title: string | null;
  avatarUrl: string | null;
  memberCount: number;
  updatedAt: string;
  mutedUntil?: string | null;
  otherParticipant: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    username: string | null;
  } | null;
  lastMessage: {
    id: string;
    type: string;
    contentPreview: string | null;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
};

function formatListTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function avatarFallback(name: string): string {
  const q = encodeURIComponent(name.slice(0, 2) || "?");
  return `https://ui-avatars.com/api/?name=${q}&background=E8E8E8&color=444`;
}

export function mapApiConversationToListItem(row: ApiConversationListItem): MockConversation {
  const isGroup = row.type === "group";
  const name =
    (isGroup ? row.title : null) ??
    row.otherParticipant?.displayName ??
    row.title ??
    "Trò chuyện";
  const avatarUrl =
    (isGroup ? row.avatarUrl : null) ?? row.otherParticipant?.avatarUrl ?? row.avatarUrl ?? avatarFallback(name);
  const preview = row.lastMessage?.contentPreview?.trim() || "";
  const mutedUntil = row.mutedUntil ? new Date(row.mutedUntil).getTime() : 0;
  const isMuted = Boolean(row.mutedUntil) && mutedUntil > Date.now();

  return {
    id: row.conversationId,
    name,
    lastMessage: preview || (row.lastMessage ? `[${row.lastMessage.type}]` : ""),
    time: formatListTime(row.updatedAt),
    unreadCount: row.unreadCount,
    avatarUrl,
    kind: isGroup ? "group" : "direct",
    memberCount: row.memberCount,
    isMuted,
    isOnline: false,
    directPeerId: isGroup ? undefined : row.otherParticipant?.id,
  };
}
