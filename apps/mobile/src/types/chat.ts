export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "seen";

export type ChatMessageKind = "text" | "image" | "system";

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  kind?: ChatMessageKind;
  imageUrl?: string;
  status?: MessageDeliveryStatus;
};
