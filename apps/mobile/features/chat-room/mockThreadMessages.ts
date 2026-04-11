import type { ChatRoomMessage } from "./types";

/**
 * Tạm thời không seed tin nhắn mock (tài khoản mới).
 * Lịch sử mock cũ có thể khôi phục từ git nếu cần.
 */
export function getMockThreadMessages(_conversationId: string): ChatRoomMessage[] {
  return [];
}
