/** Room for all sockets of a conversation member (receive message:new, typing, receipts). */
export function conversationRoomId(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/** Per-user room for targeted fan-out (e.g. friend presence). Server-only join. */
export function userDirectRoomId(userId: string): string {
  return `user:${userId}`;
}
