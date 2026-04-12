import { isAxiosError } from "axios";
import { Alert } from "react-native";

import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";

import { createOrGetDirectConversationApi } from "./conversationsApi";

export type DirectChatPeer = {
  peerUserId: string;
  displayName: string;
  avatarUrl?: string | null;
};

/** Minimal router surface used by expo-router `useRouter()`. */
export type DirectChatRouter = {
  push: (href: {
    pathname: string;
    params: Record<string, string>;
  }) => void;
};

function userFacingDirectChatError(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const raw = getApiErrorMessage(err, "");
    if (status === 403) {
      if (/only message friends/i.test(raw) || /bạn bè/i.test(raw)) {
        return "Chỉ có thể nhắn tin khi đã kết bạn.";
      }
      if (/cannot message|chặn|block/i.test(raw)) {
        return "Không thể nhắn tin với người này.";
      }
      return raw || "Không thể mở cuộc trò chuyện.";
    }
    if (status === 404) {
      return "Không tìm thấy người dùng hoặc không thể tạo cuộc trò chuyện.";
    }
  }
  return getApiErrorMessage(err);
}

/**
 * Create or resume a direct conversation (real API) or open mock chat, then navigate to `/main/chat/[id]`.
 * @returns whether navigation happened
 */
export async function openDirectChatWithPeer(
  router: DirectChatRouter,
  peer: DirectChatPeer,
  opts?: { setLoading?: (busy: boolean) => void },
): Promise<boolean> {
  const { setLoading } = opts ?? {};
  setLoading?.(true);
  try {
    if (USE_API_MOCK) {
      router.push({
        pathname: "/main/chat/[id]",
        params: {
          id: peer.peerUserId,
          title: encodeURIComponent(peer.displayName),
          peerAvatar: encodeURIComponent(peer.avatarUrl ?? ""),
          peerId: peer.peerUserId,
        },
      });
      return true;
    }

    const { conversation } = await createOrGetDirectConversationApi(peer.peerUserId);
    const title =
      conversation.otherParticipant?.displayName?.trim() || peer.displayName;
    const avatarUrl =
      conversation.otherParticipant?.avatarUrl ?? peer.avatarUrl ?? "";

    router.push({
      pathname: "/main/chat/[id]",
      params: {
        id: conversation.id,
        title: encodeURIComponent(title),
        peerAvatar: encodeURIComponent(avatarUrl),
        peerId: peer.peerUserId,
      },
    });
    return true;
  } catch (e) {
    Alert.alert("Nhắn tin", userFacingDirectChatError(e));
    return false;
  } finally {
    setLoading?.(false);
  }
}
