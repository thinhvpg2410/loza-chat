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
