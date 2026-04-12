import { createOrGetDirectConversationAction } from "@/features/chat/conversation-actions";

export function mapDirectChatErrorMessage(apiMessage: string): string {
  const m = apiMessage.trim();
  const lower = m.toLowerCase();
  if (lower.includes("only message friends") || lower.includes("message friends")) {
    return "Chỉ có thể nhắn tin với bạn bè.";
  }
  if (lower.includes("cannot message this user") || lower.includes("message this user")) {
    return "Không thể nhắn tin cho người này.";
  }
  if (lower.includes("yourself") || lower.includes("cannot message yourself")) {
    return "Không thể nhắn tin với chính mình.";
  }
  if (lower.includes("not found") || lower.includes("user not found")) {
    return "Không tìm thấy người dùng.";
  }
  return m || "Không mở được cuộc trò chuyện.";
}

type RouterPush = { push: (href: string) => void };

export async function openDirectChatWithUser(
  targetUserId: string,
  router: RouterPush,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await createOrGetDirectConversationAction(targetUserId);
  if (!r.ok) {
    return { ok: false, error: mapDirectChatErrorMessage(r.error) };
  }
  router.push(`/?open=${encodeURIComponent(r.conversationId)}`);
  return { ok: true };
}
