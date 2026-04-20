import type { ApiConversationListItem } from "@/lib/chat/api-dtos";
import type { Conversation } from "@/lib/types/chat";
import type { RelationshipStatus } from "@/lib/types/social";

function lastActivityIso(item: ApiConversationListItem): string {
  return item.lastMessage?.createdAt ?? item.updatedAt;
}

export function mapConversationListItem(item: ApiConversationListItem): Conversation {
  const isDirect = item.type === "direct";
  const title =
    (isDirect ? item.otherParticipant?.displayName : item.title) ??
    item.title ??
    "Hội thoại";
  const avatarUrl =
    (isDirect ? item.otherParticipant?.avatarUrl ?? undefined : item.avatarUrl ?? undefined) ||
    undefined;
  const preview = item.lastMessage?.contentPreview?.trim() || "";

  const rel = item.directPeerRelationshipStatus as RelationshipStatus | null | undefined;

  return {
    id: item.conversationId,
    title,
    avatarUrl,
    lastMessagePreview: preview,
    lastMessageAt: lastActivityIso(item),
    unreadCount: item.unreadCount,
    isMuted: Boolean(item.mutedUntil),
    chatType: item.type === "direct" ? "direct" : "group",
    directPeerId: isDirect ? item.otherParticipant?.id : undefined,
    directPeerRelationshipStatus: isDirect ? (rel ?? null) : null,
  };
}
