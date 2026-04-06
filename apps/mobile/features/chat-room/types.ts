/**
 * Chat room message model — structured for future reactions, attachments, realtime sync.
 */
export type MessageSenderRole = "me" | "peer";

/** Delivery UI for outgoing messages (last in group shows label). */
export type OutgoingDeliveryState = "sending" | "sent" | "delivered" | "seen";

export type ChatRoomMessage = {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  /** Outgoing only — optional per message; UI shows status on last bubble in group */
  delivery?: OutgoingDeliveryState;
};

export type MessageFeedItem =
  | { kind: "separator"; key: string; label: string }
  | { kind: "group"; key: string; messages: ChatRoomMessage[]; role: MessageSenderRole };
