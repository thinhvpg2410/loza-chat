import { apiClient } from "@/services/api/client";

import type { ApiConversationListItem } from "./conversationListMapper";

export async function fetchMyConversations(): Promise<ApiConversationListItem[]> {
  const { data } = await apiClient.get<{ conversations: ApiConversationListItem[] }>("/conversations");
  return data.conversations ?? [];
}

export type ApiConversationDetail = {
  id: string;
  type: string;
  title: string | null;
  avatarUrl: string | null;
  memberCount: number;
  otherParticipant: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    username: string | null;
  } | null;
};

export async function createOrGetDirectConversationApi(
  targetUserId: string,
): Promise<{ conversation: ApiConversationDetail }> {
  const { data } = await apiClient.post<{ conversation: ApiConversationDetail }>("/conversations/direct", {
    targetUserId,
  });
  return data;
}

export async function markConversationReadApi(conversationId: string, messageId?: string): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/read`, messageId ? { messageId } : {});
}

export type ApiAttachment = {
  id: string;
  storageKey: string;
  bucket: string;
  mimeType: string;
  originalFileName: string;
  fileSize: string;
  attachmentType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  thumbnailKey: string | null;
  createdAt: string;
};

export type ApiSticker = {
  id: string;
  packId: string;
  code: string | null;
  name: string;
  assetUrl: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  pack: { id: string; name: string; slug: string };
};

export type ApiMessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  type: string;
  content: string | null;
  metadataJson: unknown;
  replyToMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    username: string | null;
  };
  attachments: ApiAttachment[];
  sticker: ApiSticker | null;
  reactions: {
    counts: { reaction: string; count: number }[];
    mine: string[];
  };
};

export type ApiMessageWithReceipt = ApiMessageView & {
  sentByViewer: boolean;
  deliveredToPeer: boolean;
  seenByPeer: boolean;
};

export async function fetchConversationMessagesPage(
  conversationId: string,
  opts?: { cursor?: string; limit?: number },
): Promise<{ messages: ApiMessageWithReceipt[]; nextCursor: string | null }> {
  const { data } = await apiClient.get<{
    messages: ApiMessageWithReceipt[];
    nextCursor: string | null;
  }>(`/conversations/${conversationId}/messages`, {
    params: {
      cursor: opts?.cursor,
      limit: opts?.limit ?? 50,
    },
  });
  return {
    messages: data.messages ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}
