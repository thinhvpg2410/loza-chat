import { apiClient } from "@/services/api/client";

import type { ApiMessageView } from "../conversations/conversationsApi";

export async function sendTextMessageApi(payload: {
  conversationId: string;
  clientMessageId: string;
  content: string;
  replyToMessageId?: string;
}): Promise<{ message: ApiMessageView; created: boolean }> {
  const { data } = await apiClient.post<{ message: ApiMessageView; created: boolean }>("/messages", payload);
  return data;
}

export async function sendMessageWithAttachmentsApi(payload: {
  conversationId: string;
  clientMessageId: string;
  type: "image" | "file" | "voice" | "video" | "other";
  attachmentIds: string[];
  content?: string;
  replyToMessageId?: string;
}): Promise<{ message: ApiMessageView; created: boolean }> {
  const { data } = await apiClient.post<{ message: ApiMessageView; created: boolean }>(
    "/messages/with-attachments",
    payload,
  );
  return data;
}

export async function addMessageReactionApi(
  messageId: string,
  reaction: string,
): Promise<{
  summary: { counts: { reaction: string; count: number }[]; mine: string[] };
  alreadyExists: boolean;
}> {
  const { data } = await apiClient.post<{
    summary: { counts: { reaction: string; count: number }[]; mine: string[] };
    alreadyExists: boolean;
  }>(`/messages/${messageId}/reactions`, { reaction });
  return data;
}

export async function recallMessageApi(messageId: string): Promise<{ message: ApiMessageView }> {
  const { data } = await apiClient.post<{ message: ApiMessageView }>(`/messages/${messageId}/recall`);
  return data;
}

export async function deleteMessageApi(messageId: string): Promise<{ message: ApiMessageView }> {
  const { data } = await apiClient.delete<{ message: ApiMessageView }>(`/messages/${messageId}`);
  return data;
}

export async function forwardMessageApi(payload: {
  messageId: string;
  targetConversationId: string;
  clientMessageId: string;
}): Promise<{ message: ApiMessageView; created?: boolean }> {
  const { data } = await apiClient.post<{ message: ApiMessageView; created?: boolean }>(
    `/messages/${payload.messageId}/forward`,
    {
      targetConversationId: payload.targetConversationId,
      clientMessageId: payload.clientMessageId,
    },
  );
  return data;
}
