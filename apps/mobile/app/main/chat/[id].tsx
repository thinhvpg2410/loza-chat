import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Network from "expo-network";
import * as WebBrowser from "expo-web-browser";
import { Audio } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AttachmentSheet,
  type AttachmentKind,
  ChatRoomHeader,
  EmojiPickerSheet,
  ForwardConversationSheet,
  FilePreviewModal,
  ImageViewerModal,
  MessageActionsSheet,
  type MessageActionId,
  type MessageActionItem,
  MessageInputBar,
  MessageList,
  type MessageListHandle,
  type MockSticker,
  ReactionPickerSheet,
  StickerPickerSheet,
  TypingIndicator,
} from "@components/chat";
import { USE_API_MOCK } from "@/constants/env";
import { MOCK_CONVERSATIONS } from "@/constants/mockData";
import {
  applyOutgoingReceiptFromPeerPointer,
  getMockThreadMessages,
  mapApiMessagesToChatRoomList,
  mergeReactionsFromSocketBroadcast,
  mergeReactionsFromSummary,
  newClientMessageId,
  toggleReactionOnMessage,
  type ChatRoomMessage,
  type ReplyReference,
} from "@features/chat-room";
import { getApiErrorMessage } from "@/services/api/api";
import {
  fetchConversationMessagesPage,
  markConversationReadApi,
  type ApiMessageView,
  type ApiMessageWithReceipt,
} from "@/services/conversations/conversationsApi";
import { fetchGroupDetailApi, type GroupDetailDto } from "@/services/groups/groupsApi";
import {
  addMessageReactionApi,
  deleteMessageApi,
  forwardMessageApi,
  hideMessageForSelfApi,
  recallMessageApi,
  removeMessageReactionApi,
  sendMessageWithAttachmentsApi,
  sendTextMessageApi,
} from "@/services/messages/messagesApi";
import {
  clearChatRealtimeHandlers,
  emitConversationJoin,
  emitConversationReceiptsFromMyProgress,
  emitTypingStart,
  emitTypingStop,
  isChatSocketConfigured,
  setChatRealtimeHandlers,
  subscribeSocketConnectionStatus,
  subscribeGroupRoomEvents,
} from "@/services/socket/socket";
import { uploadLocalFileToAttachment } from "@/services/uploads/directUpload";
import { trackClientError } from "@/services/telemetry/telemetry";
import { appStorage } from "@/storage/appStorage";
import { buildDocumentPreviewEmbedUrl, isDocumentPreviewable } from "@/lib/document-preview-url";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { AppText } from "@ui/AppText";
import { colors } from "@theme";

function decodeParam(v: string | string[] | undefined): string | undefined {
  if (typeof v !== "string") return undefined;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function previewLine(m: ChatRoomMessage): string {
  switch (m.kind) {
    case "text":
      return m.body ?? "";
    case "image":
      return "📷 Ảnh";
    case "file":
      return m.file?.name ?? "📎 Tệp";
    case "sticker":
      return m.stickerEmoji ?? "🎭 Sticker";
    case "groupEvent":
      return m.groupEventBadge ?? "Sự kiện nhóm";
    default:
      return "";
  }
}

function toReplyRef(m: ChatRoomMessage, peerName: string): ReplyReference {
  return {
    id: m.id,
    senderLabel: m.senderRole === "me" ? "Bạn" : peerName,
    preview: previewLine(m),
  };
}

function copyableText(m: ChatRoomMessage): string {
  switch (m.kind) {
    case "text":
      return m.body ?? "";
    case "file":
      return m.file?.name ?? "";
    case "image":
      return m.imageUrl ?? "";
    case "sticker":
      return m.stickerEmoji ?? "";
    case "groupEvent":
      return [m.groupEventBadge, m.groupEventDetail].filter(Boolean).join(" — ");
    default:
      return "";
  }
}

function asReceiptView(msg: ApiMessageView, viewerId: string): ApiMessageWithReceipt {
  return {
    ...msg,
    sentByViewer: msg.senderId === viewerId,
    deliveredToPeer: false,
    seenByPeer: false,
  };
}

const CHAT_PREF_REDUCE_AUTO_DOWNLOAD_ON_CELLULAR = "chat.reduce_auto_download_on_cellular";

function mergeMessagesById(prev: ChatRoomMessage[], incoming: ChatRoomMessage[]): ChatRoomMessage[] {
  const byId = new Map<string, ChatRoomMessage>();
  for (const m of prev) {
    byId.set(m.id, m);
  }
  for (const m of incoming) {
    byId.set(m.id, m);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewerId = useAuthStore((s) => s.user?.id ?? "");
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const conversations = useChatStore((s) => s.conversations);

  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    peerAvatar?: string;
    peerId?: string;
    messageId?: string;
  }>();

  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const listRow = useChatStore((s) => s.conversations.find((c) => c.id === id));

  const title = useMemo(() => decodeParam(params.title) ?? `Chat ${id}`, [params.title, id]);
  const peerAvatar = decodeParam(params.peerAvatar);
  const paramPeerId = decodeParam(params.peerId) ?? "";
  const directPeerId = paramPeerId || (listRow?.kind === "direct" ? listRow.directPeerId : undefined) || "";
  const focusMessageId = decodeParam(params.messageId);

  const peerMeta = useMemo(() => MOCK_CONVERSATIONS.find((c) => c.id === id), [id]);
  const isGroup = listRow?.kind === "group" || peerMeta?.kind === "group";
  const memberCount = listRow?.memberCount ?? peerMeta?.memberCount ?? 0;

  const lastGroupDissolved = useChatStore((s) => s.lastGroupDissolved);
  const lastDissolveHandledSeq = useRef(0);
  useEffect(() => {
    if (USE_API_MOCK) return;
    if (!id) return;
    if (!lastGroupDissolved || lastGroupDissolved.conversationId !== id) return;
    if (lastGroupDissolved.seq <= lastDissolveHandledSeq.current) return;
    lastDissolveHandledSeq.current = lastGroupDissolved.seq;
    router.back();
  }, [lastGroupDissolved, id, router]);

  const displayName = listRow?.name ?? peerMeta?.name ?? title;
  const displayAvatar = peerAvatar ?? listRow?.avatarUrl ?? peerMeta?.avatarUrl;

  const statusText = useMemo(() => {
    if (USE_API_MOCK) {
      if (isGroup) return `${memberCount} thành viên`;
      if (peerMeta?.isOnline) return "Đang hoạt động";
      return "Vừa truy cập";
    }
    if (isGroup) return `${memberCount || "—"} thành viên`;
    return "Trò chuyện";
  }, [isGroup, memberCount, peerMeta?.isOnline]);

  const directSendGuard = useMemo(() => {
    if (USE_API_MOCK || isGroup) {
      return { canSend: true, bannerKind: null as null | "blocked_by_me" | "blocked_me" | "stranger" };
    }
    const rel = listRow?.directPeerRelationshipStatus;
    if (rel === "blocked_by_me") return { canSend: false, bannerKind: "blocked_by_me" as const };
    if (rel === "blocked_me") return { canSend: false, bannerKind: "blocked_me" as const };
    if (!rel || rel === "friend") return { canSend: true, bannerKind: null };
    return { canSend: true, bannerKind: "stranger" as const };
  }, [isGroup, listRow?.directPeerRelationshipStatus]);

  const openGroupInfo = useCallback(() => {
    if (!isGroup) return;
    router.push({
      pathname: "/main/group/[id]",
      params: {
        id,
        title: encodeURIComponent(displayName),
        avatarUrl: encodeURIComponent(displayAvatar ?? ""),
      },
    });
  }, [displayAvatar, displayName, id, isGroup, router]);

  const [groupDetail, setGroupDetail] = useState<GroupDetailDto | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);

  const refreshGroupDetail = useCallback(() => {
    if (USE_API_MOCK || !isGroup || !id) {
      setGroupDetail(null);
      return;
    }
    void fetchGroupDetailApi(id)
      .then((r) => {
        setGroupDetail(r.group);
      })
      .catch(() => {
        setGroupDetail(null);
      });
  }, [id, isGroup]);

  useEffect(() => {
    refreshGroupDetail();
  }, [refreshGroupDetail]);

  useEffect(() => {
    if (USE_API_MOCK || !isGroup || !id) return () => {};
    const unsub = subscribeGroupRoomEvents((ev) => {
      if (ev.conversationId !== id) return;
      if (ev.type === "group_dissolved") {
        setGroupDetail(null);
        return;
      }
      refreshGroupDetail();
    });
    return unsub;
  }, [id, isGroup, refreshGroupDetail]);

  useEffect(() => {
    if (USE_API_MOCK || !isGroup || !id) return () => {};
    const onChange = (state: AppStateStatus) => {
      if (state !== "active") return;
      refreshGroupDetail();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [id, isGroup, refreshGroupDetail]);

  const groupSendGuard = useMemo(() => {
    if (USE_API_MOCK || !isGroup) return { canSend: true, banner: null as string | null };
    if (!groupDetail) return { canSend: true, banner: null };
    if (groupDetail.myStatus === "pending") {
      return { canSend: false, banner: "Bạn đang chờ trưởng nhóm hoặc phó nhóm duyệt vào nhóm." };
    }
    if (groupDetail.settings.onlyAdminsCanPost && groupDetail.myRole === "member") {
      return { canSend: false, banner: "Chỉ trưởng nhóm và phó nhóm được gửi tin trong nhóm này." };
    }
    return { canSend: true, banner: null };
  }, [isGroup, groupDetail]);

  const canSendInThread = USE_API_MOCK
    ? directSendGuard.canSend
    : isGroup
      ? groupSendGuard.canSend
      : directSendGuard.canSend;
  const mentionCandidates = useMemo(
    () =>
      !isGroup || !groupDetail
        ? []
        : groupDetail.members
            .filter((m) => m.user.id !== viewerId)
            .map((m) => ({
              userId: m.user.id,
              displayName: m.user.displayName,
              username: m.user.username,
            })),
    [groupDetail, isGroup, viewerId],
  );

  const alertCannotSend = useCallback(() => {
    if (isGroup) {
      Alert.alert(
        "Không thể gửi",
        groupSendGuard.banner ?? "Bạn không thể gửi tin nhắn trong cuộc trò chuyện này.",
      );
      return;
    }
    Alert.alert(
      "Không thể gửi",
      directSendGuard.bannerKind === "blocked_by_me" ? "Bạn đã chặn người này." : "Bạn đã bị chặn.",
    );
  }, [directSendGuard.bannerKind, groupSendGuard.banner, isGroup]);

  const [messages, setMessages] = useState<ChatRoomMessage[]>(() =>
    USE_API_MOCK ? getMockThreadMessages(id) : [],
  );
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(!USE_API_MOCK);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [typingPeerCount, setTypingPeerCount] = useState(0);
  const [socketStatus, setSocketStatus] = useState<{
    state: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";
    detail: string | null;
  }>({ state: "idle", detail: null });
  const typingPeersRef = useRef<Map<string, boolean>>(new Map());

  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [filePreview, setFilePreview] = useState<{
    title: string;
    embedUrl: string;
    downloadUrl: string;
  } | null>(null);

  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<ChatRoomMessage | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardBusy, setForwardBusy] = useState(false);

  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceRecordingDurationSec, setVoiceRecordingDurationSec] = useState(0);
  const [voiceDraftNotice, setVoiceDraftNotice] = useState<string | null>(null);
  const [reduceAutoDownloadOnCellular, setReduceAutoDownloadOnCellular] = useState(true);
  const [isCellularConnection, setIsCellularConnection] = useState(false);
  const voiceRecordingRef = useRef<Audio.Recording | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatRoomMessage[]>(messages);
  messagesRef.current = messages;
  const offlineQueueRef = useRef<
    Array<{ localId: string; body: string; replyToMessageId?: string; attempts: number }>
  >([]);
  const messageListRef = useRef<MessageListHandle | null>(null);

  const stopVoiceRecording = useCallback(
    async (opts?: { discard?: boolean; showDraftNotice?: boolean }) => {
      const recording = voiceRecordingRef.current;
      if (!recording) return null;
      const discard = opts?.discard ?? false;
      const showDraftNotice = opts?.showDraftNotice ?? false;
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        voiceRecordingRef.current = null;
        setVoiceRecording(false);
        setVoiceRecordingDurationSec(0);
        if (voiceTimerRef.current) {
          clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }
        if (discard || !uri) return null;
        if (showDraftNotice) {
          setVoiceDraftNotice("Ghi âm đã tự dừng khi app chạy nền. Bạn có thể gửi lại.");
        }
        return uri;
      } catch {
        voiceRecordingRef.current = null;
        setVoiceRecording(false);
        setVoiceRecordingDurationSec(0);
        if (voiceTimerRef.current) {
          clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      void stopVoiceRecording({ discard: true });
      voiceRecordingRef.current = null;
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
    };
  }, [stopVoiceRecording]);

  useEffect(() => {
    let mounted = true;
    void appStorage
      .getItem(CHAT_PREF_REDUCE_AUTO_DOWNLOAD_ON_CELLULAR)
      .then((v) => {
        if (!mounted) return;
        setReduceAutoDownloadOnCellular(v !== "0");
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const syncNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!cancelled) {
          setIsCellularConnection(state.type === Network.NetworkStateType.CELLULAR);
        }
      } catch {
        if (!cancelled) setIsCellularConnection(false);
      }
    };
    void syncNetwork();
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncNetwork();
      }
    });
    return () => {
      cancelled = true;
      appSub.remove();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") return;
      if (!voiceRecording) return;
      void stopVoiceRecording({ showDraftNotice: true });
    });
    return () => sub.remove();
  }, [stopVoiceRecording, voiceRecording]);

  useEffect(() => {
    const unsub = subscribeSocketConnectionStatus((state, detail) => {
      setSocketStatus({ state, detail: detail ?? null });
    });
    return unsub;
  }, []);

  useEffect(() => {
    typingPeersRef.current.clear();
    setTypingPeerCount(0);
    setNextCursor(null);
    if (USE_API_MOCK) {
      setMessages(getMockThreadMessages(id));
      setReplyingTo(null);
      setMessagesError(null);
      setMessagesLoading(false);
    }
  }, [id]);

  const loadMessagesFromApi = useCallback(async () => {
    if (USE_API_MOCK || !id) return;
    if (!viewerId) {
      setMessagesLoading(false);
      return;
    }
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const { messages: rows, nextCursor: nc } = await fetchConversationMessagesPage(id, { limit: 50 });
      setNextCursor(nc);
      setMessages(mapApiMessagesToChatRoomList(rows, viewerId, displayName));
      try {
        const readRes = await markConversationReadApi(id);
        emitConversationReceiptsFromMyProgress(id, readRes.state.me);
        void fetchConversations();
      } catch {
        /* non-fatal */
      }
    } catch (e) {
      setMessagesError(getApiErrorMessage(e));
    } finally {
      setMessagesLoading(false);
    }
  }, [displayName, fetchConversations, id, viewerId]);

  const loadOlderMessages = useCallback(async () => {
    if (USE_API_MOCK || !id || !nextCursor || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const { messages: rows, nextCursor: nc } = await fetchConversationMessagesPage(id, {
        cursor: nextCursor,
        limit: 50,
      });
      const mapped = mapApiMessagesToChatRoomList(rows, viewerId, displayName);
      setMessages((prev) => mergeMessagesById(prev, mapped));
      setNextCursor(nc);
    } catch {
      /* ignore */
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [displayName, id, nextCursor, viewerId]);

  useEffect(() => {
    if (USE_API_MOCK) return;
    void loadMessagesFromApi();
  }, [loadMessagesFromApi]);

  /** Only clear socket handlers when this screen unmounts — not on blur (avoids wiping the next chat's handlers when A blurs after B focuses). */
  useEffect(() => {
    return () => {
      clearChatRealtimeHandlers();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (USE_API_MOCK || !isChatSocketConfigured() || !id || !viewerId) {
        return () => {};
      }

      void fetchConversations();

      typingPeersRef.current.clear();
      setTypingPeerCount(0);
      emitConversationJoin(id);

      setChatRealtimeHandlers({
        onSocketConnected: () => {
          emitConversationJoin(id);
        },
        onMessageNew: (msg) => {
          if (msg.conversationId !== id) return;
          const row = asReceiptView(msg, viewerId);
          setMessages((prev) =>
            mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)),
          );
          if (msg.senderId !== viewerId) {
            void markConversationReadApi(id, msg.id)
              .then((readRes) => {
                emitConversationReceiptsFromMyProgress(id, readRes.state.me);
                void fetchConversations();
              })
              .catch(() => {
                void fetchConversations();
              });
          }
        },
        onMessageUpdated: (msg) => {
          if (msg.conversationId !== id) return;
          const row = asReceiptView(msg, viewerId);
          setMessages((prev) =>
            mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)),
          );
          void fetchConversations();
        },
        onTypingUpdate: (p) => {
          if (p.conversationId !== id) return;
          if (p.userId === viewerId) return;
          const m = typingPeersRef.current;
          if (p.isTyping) m.set(p.userId, true);
          else m.delete(p.userId);
          setTypingPeerCount([...m.keys()].filter((uid) => uid !== viewerId).length);
        },
        onReactionUpdated: (p) => {
          if (p.conversationId !== id) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === p.messageId
                ? { ...m, reactions: mergeReactionsFromSocketBroadcast(m.reactions, p.summary) }
                : m,
            ),
          );
        },
        onMessageDelivered: (p) => {
          if (isGroup) return;
          if (p.conversationId !== id) return;
          if (p.userId === viewerId) return;
          if (directPeerId && p.userId !== directPeerId) return;
          setMessages((prev) => applyOutgoingReceiptFromPeerPointer(prev, p.messageId, "delivered"));
        },
        onMessageSeen: (p) => {
          if (isGroup) return;
          if (p.conversationId !== id) return;
          if (p.userId === viewerId) return;
          if (directPeerId && p.userId !== directPeerId) return;
          setMessages((prev) => applyOutgoingReceiptFromPeerPointer(prev, p.messageId, "seen"));
        },
      });

      return () => {
        emitTypingStop(id);
        if (typingStopTimer.current) {
          clearTimeout(typingStopTimer.current);
          typingStopTimer.current = null;
        }
      };
    }, [directPeerId, displayName, fetchConversations, id, isGroup, viewerId]),
  );

  useEffect(() => {
    if (USE_API_MOCK || !isChatSocketConfigured() || !id) return;
    if (!canSendInThread) {
      emitTypingStop(id);
      return;
    }
    if (!draft.trim().length) {
      emitTypingStop(id);
      return;
    }
    emitTypingStart(id);
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      emitTypingStop(id);
      typingStopTimer.current = null;
    }, 2000);

    const typingKeepAlive = setInterval(() => {
      emitTypingStart(id);
    }, 8000);

    return () => {
      if (typingStopTimer.current) {
        clearTimeout(typingStopTimer.current);
        typingStopTimer.current = null;
      }
      clearInterval(typingKeepAlive);
    };
  }, [draft, canSendInThread, id]);

  const openImageViewer = useCallback((uri: string) => {
    setViewerUri(uri);
    setViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setViewerOpen(false);
    setViewerUri(null);
  }, []);

  const onMessagePress = useCallback((m: ChatRoomMessage) => {
    if (m.kind === "groupEvent") return;
    if (m.kind === "image") return;
    if (m.isRemoved) return;

    if (m.kind === "file" && m.file?.url) {
      const { url, name, mime } = { url: m.file.url, name: m.file.name, mime: m.file.mime };
      if (isDocumentPreviewable(name, mime)) {
        setFilePreview({
          title: name,
          embedUrl: buildDocumentPreviewEmbedUrl(url, name, mime),
          downloadUrl: url,
        });
        return;
      }
      void WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
      return;
    }

    setReactionTargetId(m.id);
  }, []);

  const onMessageLongPress = useCallback((m: ChatRoomMessage) => {
    if (m.kind === "groupEvent") return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionTarget(m);
  }, []);

  const actionItems = useMemo<MessageActionItem[]>(() => {
    if (!actionTarget || actionTarget.kind === "groupEvent") return [];
    const own = actionTarget.senderRole === "me";
    const removed = Boolean(actionTarget.isRemoved);
    const modRecall =
      !USE_API_MOCK &&
      isGroup &&
      groupDetail &&
      Boolean(groupDetail.settings.moderatorsCanRecallMessages) &&
      (groupDetail.myRole === "owner" || groupDetail.myRole === "admin") &&
      !own;
    const items: MessageActionItem[] = [];
    if (!removed) {
      items.push({ id: "reply", label: "Trả lời", icon: "arrow-undo-outline" });
      items.push({ id: "copy", label: "Sao chép", icon: "copy-outline" });
      items.push({ id: "react", label: "Cảm xúc", icon: "happy-outline" });
      items.push({ id: "forward", label: "Chuyển tiếp", icon: "arrow-redo-outline" });
    }
    if (!removed && !USE_API_MOCK) {
      items.push({ id: "hide_self", label: "Ẩn phía tôi", icon: "eye-off-outline" });
    }
    if (own && !removed) {
      items.push({ id: "recall", label: "Thu hồi", icon: "return-up-back-outline", danger: true });
      items.push({ id: "delete", label: "Xóa", icon: "trash-outline", danger: true });
    } else if (modRecall && !removed) {
      items.push({ id: "recall", label: "Thu hồi (quản trị)", icon: "return-up-back-outline", danger: true });
    }
    return items;
  }, [actionTarget, groupDetail, isGroup]);

  const forwardTargets = useMemo(
    () =>
      conversations
        .filter((c) => c.id !== id)
        .map((c) => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl })),
    [conversations, id],
  );

  const applyReaction = useCallback(async (messageId: string, emoji: string) => {
    if (USE_API_MOCK) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: toggleReactionOnMessage(msg.reactions, emoji) }
            : msg,
        ),
      );
      return;
    }
    const msg = messagesRef.current.find((m) => m.id === messageId);
    if (!msg || msg.kind === "groupEvent") return;
    const effective = msg.reactions ?? [];
    const mine = effective.filter((r) => r.reactedByMe).map((r) => r.emoji);
    const isMine = effective.some((r) => r.emoji === emoji && r.reactedByMe);

    try {
      if (isMine) {
        const { summary } = await removeMessageReactionApi(messageId, emoji);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reactions: mergeReactionsFromSummary(summary) } : m,
          ),
        );
        return;
      }
      for (const e of mine) {
        const { summary } = await removeMessageReactionApi(messageId, e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reactions: mergeReactionsFromSummary(summary) } : m,
          ),
        );
      }
      const { summary } = await addMessageReactionApi(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, reactions: mergeReactionsFromSummary(summary) } : m,
        ),
      );
    } catch (e) {
      Alert.alert("Không thể gửi cảm xúc", getApiErrorMessage(e));
    }
  }, []);

  const onReactionEmoji = useCallback(
    (messageId: string, emoji: string) => {
      void applyReaction(messageId, emoji);
    },
    [applyReaction],
  );

  const onReactionPick = useCallback(
    (emoji: string) => {
      if (!reactionTargetId) return;
      void applyReaction(reactionTargetId, emoji);
      setReactionTargetId(null);
    },
    [applyReaction, reactionTargetId],
  );

  const handleAction = useCallback(
    async (actionId: MessageActionId) => {
      const msg = actionTarget;
      if (!msg) return;

      if (actionId === "reply") {
        void Haptics.selectionAsync();
        setReplyingTo(toReplyRef(msg, displayName));
      } else if (actionId === "copy") {
        void Haptics.selectionAsync();
        const text = copyableText(msg);
        if (text.length) await Clipboard.setStringAsync(text);
      } else if (actionId === "react") {
        void Haptics.selectionAsync();
        setReactionTargetId(msg.id);
      } else if (actionId === "recall") {
        if (USE_API_MOCK) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    kind: "text",
                    body: "Tin nhắn đã được thu hồi",
                    file: undefined,
                    imageUrl: undefined,
                    stickerUrl: undefined,
                    stickerEmoji: undefined,
                    isRemoved: true,
                    removalMode: "recalled",
                    replyTo: undefined,
                    reactions: [],
                  }
                : m,
            ),
          );
          return;
        }
        const runRecall = () => {
          void (async () => {
            try {
              const { message } = await recallMessageApi(msg.id);
              const row = asReceiptView(message, viewerId);
              setMessages((prev) =>
                mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)),
              );
              void fetchConversations();
            } catch (e) {
              Alert.alert("Thu hồi tin nhắn", getApiErrorMessage(e));
            }
          })();
        };
        if (msg.senderRole !== "me") {
          Alert.alert("Thu hồi tin nhắn", "Thu hồi tin của thành viên này cho mọi người trong nhóm?", [
            { text: "Hủy", style: "cancel" },
            { text: "Thu hồi", style: "destructive", onPress: runRecall },
          ]);
          return;
        }
        Alert.alert("Thu hồi tin nhắn", "Mọi người sẽ thấy tin đã được thu hồi.", [
          { text: "Hủy", style: "cancel" },
          { text: "Thu hồi", style: "destructive", onPress: runRecall },
        ]);
      } else if (actionId === "hide_self") {
        if (USE_API_MOCK) return;
        Alert.alert("Ẩn tin nhắn", "Tin sẽ không còn hiển thị trên thiết bị này.", [
          { text: "Hủy", style: "cancel" },
          {
            text: "Ẩn",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  await hideMessageForSelfApi(msg.id);
                  setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                  void fetchConversations();
                } catch (e) {
                  Alert.alert("Ẩn tin nhắn", getApiErrorMessage(e));
                }
              })();
            },
          },
        ]);
      } else if (actionId === "delete") {
        if (USE_API_MOCK) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    kind: "text",
                    body: "Tin nhắn đã bị xóa",
                    file: undefined,
                    imageUrl: undefined,
                    stickerUrl: undefined,
                    stickerEmoji: undefined,
                    isRemoved: true,
                    removalMode: "deleted",
                    replyTo: undefined,
                    reactions: [],
                  }
                : m,
            ),
          );
          return;
        }
        const runDelete = () => {
          void (async () => {
            try {
              const { message } = await deleteMessageApi(msg.id);
              const row = asReceiptView(message, viewerId);
              setMessages((prev) =>
                mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)),
              );
              void fetchConversations();
            } catch (e) {
              Alert.alert("Xóa tin nhắn", getApiErrorMessage(e));
            }
          })();
        };
        Alert.alert("Xóa tin nhắn", "Tin sẽ bị xóa với mọi người trong cuộc trò chuyện.", [
          { text: "Hủy", style: "cancel" },
          { text: "Xóa", style: "destructive", onPress: runDelete },
        ]);
      } else if (actionId === "forward") {
        setForwardOpen(true);
      }
    },
    [actionTarget, displayName, fetchConversations, viewerId],
  );

  const onForwardPick = useCallback(
    async (targetConversationId: string) => {
      const msg = actionTarget;
      if (!msg) return;
      if (USE_API_MOCK) {
        Alert.alert("Chuyển tiếp", "Bản mock chưa hỗ trợ chuyển tiếp.");
        return;
      }
      setForwardBusy(true);
      try {
        await forwardMessageApi({
          messageId: msg.id,
          targetConversationId,
          clientMessageId: newClientMessageId(),
        });
        setForwardOpen(false);
        setActionTarget(null);
        void fetchConversations();
      } catch (e) {
        Alert.alert("Chuyển tiếp tin nhắn", getApiErrorMessage(e));
      } finally {
        setForwardBusy(false);
      }
    },
    [actionTarget, fetchConversations],
  );

  const appendOutgoing = useCallback((msg: ChatRoomMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const pickPhoto = useCallback(async () => {
    if (!USE_API_MOCK && !canSendInThread) {
      alertCannotSend();
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Cần quyền thư viện ảnh để gửi ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
      videoMaxDuration: 120,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = asset?.uri;
    if (!uri) return;

    if (USE_API_MOCK) {
      appendOutgoing({
        id: `local-img-${Date.now()}`,
        conversationId: id,
        senderRole: "me",
        kind: "image",
        imageUrl: uri,
        imageWidth: asset?.width ?? 800,
        imageHeight: asset?.height ?? 600,
        createdAt: new Date().toISOString(),
        delivery: "delivered",
      });
      return;
    }

    if (!viewerId) return;
    try {
      const isVideo = (asset.type ?? "").toLowerCase() === "video";
      const optimizedUri = isVideo
        ? asset.uri
        : (
            await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1280 } }], {
              compress: 0.72,
              format: ImageManipulator.SaveFormat.JPEG,
            })
          ).uri;
      const mime = isVideo ? asset.mimeType ?? "video/mp4" : "image/jpeg";
      const name = asset.fileName ?? (isVideo ? "video.mp4" : "photo.jpg");
      const att = await uploadLocalFileToAttachment({
        fileUri: optimizedUri,
        fileName: name,
        mimeType: mime,
        uploadType: isVideo ? "video" : "image",
        width: asset.width,
        height: asset.height,
      });
      const { message } = await sendMessageWithAttachmentsApi({
        conversationId: id,
        clientMessageId: newClientMessageId(),
        type: isVideo ? "video" : "image",
        attachmentIds: [att.id],
        replyToMessageId: replyingTo?.id,
      });
      setReplyingTo(null);
      const row = asReceiptView(message, viewerId);
      setMessages((prev) => mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)));
      void fetchConversations();
    } catch (e) {
      Alert.alert("Gửi ảnh", getApiErrorMessage(e));
    }
  }, [
    alertCannotSend,
    appendOutgoing,
    canSendInThread,
    displayName,
    fetchConversations,
    id,
    replyingTo?.id,
    viewerId,
  ]);

  const pickFile = useCallback(async () => {
    if (!USE_API_MOCK && !canSendInThread) {
      alertCannotSend();
      return;
    }
    if (USE_API_MOCK) {
      appendOutgoing({
        id: `local-file-${Date.now()}`,
        conversationId: id,
        senderRole: "me",
        kind: "file",
        file: { name: "Tai_lieu.pdf", sizeBytes: 512_000, mime: "application/pdf" },
        createdAt: new Date().toISOString(),
        delivery: "delivered",
      });
      return;
    }
    if (!viewerId) return;
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets?.[0];
    if (!file?.uri) return;
    try {
      const mime = file.mimeType ?? "application/octet-stream";
      const name = file.name ?? "file";
      const att = await uploadLocalFileToAttachment({
        fileUri: file.uri,
        fileName: name,
        mimeType: mime,
        uploadType: "file",
      });
      const { message } = await sendMessageWithAttachmentsApi({
        conversationId: id,
        clientMessageId: newClientMessageId(),
        type: "file",
        attachmentIds: [att.id],
        replyToMessageId: replyingTo?.id,
      });
      setReplyingTo(null);
      const row = asReceiptView(message, viewerId);
      setMessages((prev) => mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)));
      void fetchConversations();
    } catch (e) {
      Alert.alert("Gửi tệp", getApiErrorMessage(e));
    }
  }, [
    alertCannotSend,
    appendOutgoing,
    canSendInThread,
    displayName,
    fetchConversations,
    id,
    replyingTo?.id,
    viewerId,
  ]);

  const onAttachmentPick = useCallback(
    (kind: AttachmentKind) => {
      if (!USE_API_MOCK && !canSendInThread) {
        alertCannotSend();
        return;
      }
      if (kind === "photo") {
        void Haptics.selectionAsync();
        void pickPhoto();
      } else if (kind === "file") {
        void Haptics.selectionAsync();
        void pickFile();
      } else if (kind === "voice") {
        void Haptics.selectionAsync();
        void (async () => {
          if (voiceRecording) {
            try {
              const uri = await stopVoiceRecording();
              if (!uri) {
                Alert.alert("Ghi âm", "Không đọc được file ghi âm.");
                return;
              }
              const att = await uploadLocalFileToAttachment({
                fileUri: uri,
                fileName: `voice-${Date.now()}.m4a`,
                mimeType: "audio/mp4",
                uploadType: "voice",
              });
              const { message } = await sendMessageWithAttachmentsApi({
                conversationId: id,
                clientMessageId: newClientMessageId(),
                type: "voice",
                attachmentIds: [att.id],
                replyToMessageId: replyingTo?.id,
              });
              setReplyingTo(null);
              const row = asReceiptView(message, viewerId);
              setMessages((prev) =>
                mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)),
              );
              void fetchConversations();
            } catch (e) {
              Alert.alert("Ghi âm", getApiErrorMessage(e));
            }
            return;
          }
          try {
            const perm = await Audio.requestPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Quyền micro",
                "Cần cấp quyền micro để ghi âm. Vui lòng bật quyền trong cài đặt ứng dụng.",
              );
              return;
            }
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );
            voiceRecordingRef.current = recording;
            setVoiceRecording(true);
            setVoiceRecordingDurationSec(0);
            if (voiceTimerRef.current) {
              clearInterval(voiceTimerRef.current);
            }
            voiceTimerRef.current = setInterval(() => {
              setVoiceRecordingDurationSec((sec) => sec + 1);
            }, 1000);
          } catch (e) {
            Alert.alert("Ghi âm", getApiErrorMessage(e));
            setVoiceRecording(false);
            setVoiceRecordingDurationSec(0);
            voiceRecordingRef.current = null;
            if (voiceTimerRef.current) {
              clearInterval(voiceTimerRef.current);
              voiceTimerRef.current = null;
            }
          }
        })();
      } else if (kind === "sticker") {
        setStickerOpen(true);
      } else if (kind === "camera") {
        Alert.alert("Camera", "Placeholder — tích hợp camera sau.");
      }
    },
    [alertCannotSend, canSendInThread, displayName, fetchConversations, id, pickFile, pickPhoto, replyingTo?.id, viewerId, voiceRecording],
  );

  const toggleVoiceRecording = useCallback(() => {
    onAttachmentPick("voice");
  }, [onAttachmentPick]);

  const cancelVoiceRecording = useCallback(() => {
    void stopVoiceRecording({ discard: true });
  }, [stopVoiceRecording]);

  const onStickerPick = useCallback(
    (sticker: MockSticker) => {
      appendOutgoing({
        id: `local-st-${Date.now()}`,
        conversationId: id,
        senderRole: "me",
        kind: "sticker",
        stickerEmoji: sticker.emoji,
        stickerUrl: sticker.url,
        stickerId: sticker.id,
        createdAt: new Date().toISOString(),
        delivery: "delivered",
      });
    },
    [appendOutgoing, id],
  );

  const onEmojiPick = useCallback((emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`);
  }, []);

  const enqueueOfflineText = useCallback(
    (body: string, replyToMessageId?: string) => {
      const localId = `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      offlineQueueRef.current.push({ localId, body, replyToMessageId, attempts: 0 });
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          conversationId: id,
          senderRole: "me",
          kind: "text",
          body,
          createdAt: new Date().toISOString(),
          delivery: "sending",
          replyTo: replyingTo ?? undefined,
        },
      ]);
    },
    [id, replyingTo],
  );

  const flushOfflineQueue = useCallback(async () => {
    if (USE_API_MOCK || !id || !viewerId || offlineQueueRef.current.length === 0) return;
    if (socketStatus.state !== "connected") return;
    const pending = [...offlineQueueRef.current];
    for (const item of pending) {
      try {
        const { message } = await sendTextMessageApi({
          conversationId: id,
          clientMessageId: newClientMessageId(),
          content: item.body,
          replyToMessageId: item.replyToMessageId,
        });
        const row = asReceiptView(message, viewerId);
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== item.localId);
          return mergeMessagesById(filtered, mapApiMessagesToChatRoomList([row], viewerId, displayName));
        });
        offlineQueueRef.current = offlineQueueRef.current.filter((q) => q.localId !== item.localId);
      } catch (e) {
        trackClientError("chat", "flush_offline_queue_failed", e, { conversationId: id });
        offlineQueueRef.current = offlineQueueRef.current.map((q) =>
          q.localId === item.localId ? { ...q, attempts: q.attempts + 1 } : q,
        );
      }
    }
  }, [displayName, id, socketStatus.state, viewerId]);

  useEffect(() => {
    const timer = setInterval(() => {
      void flushOfflineQueue();
    }, 6000);
    return () => clearInterval(timer);
  }, [flushOfflineQueue]);

  useEffect(() => {
    if (socketStatus.state === "connected") {
      void flushOfflineQueue();
    }
  }, [flushOfflineQueue, socketStatus.state]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body.length || sendBusy) return;

    if (USE_API_MOCK) {
      const next: ChatRoomMessage = {
        id: `local-${Date.now()}`,
        conversationId: id,
        senderRole: "me",
        kind: "text",
        body,
        createdAt: new Date().toISOString(),
        delivery: "delivered",
        replyTo: replyingTo ?? undefined,
      };
      setMessages((prev) => [...prev, next]);
      setDraft("");
      setReplyingTo(null);
      return;
    }

    if (!viewerId) return;
    if (!canSendInThread) {
      alertCannotSend();
      return;
    }
    const replyToMessageId = replyingTo?.id;
    setSendBusy(true);
    void Haptics.selectionAsync();
    setDraft("");
    setReplyingTo(null);
    try {
      const clientMessageId = newClientMessageId();
      const { message } = await sendTextMessageApi({
        conversationId: id,
        clientMessageId,
        content: body,
        replyToMessageId,
      });
      const row = asReceiptView(message, viewerId);
      setMessages((prev) => mergeMessagesById(prev, mapApiMessagesToChatRoomList([row], viewerId, displayName)));
      void fetchConversations();
    } catch (e) {
      trackClientError("chat", "send_text_failed", e, { conversationId: id });
      const message = getApiErrorMessage(e);
      const shouldQueue = message.toLowerCase().includes("network") || socketStatus.state !== "connected";
      if (shouldQueue) {
        enqueueOfflineText(body, replyToMessageId);
      } else {
        Alert.alert("Gửi tin nhắn", message);
        setDraft(body);
        if (replyToMessageId) {
          setReplyingTo({
            id: replyToMessageId,
            senderLabel: "Bạn",
            preview: body.slice(0, 80),
          });
        }
      }
    } finally {
      setSendBusy(false);
    }
  }, [
    alertCannotSend,
    canSendInThread,
    draft,
    displayName,
    fetchConversations,
    id,
    enqueueOfflineText,
    replyingTo,
    sendBusy,
    socketStatus.state,
    viewerId,
  ]);

  const showTypingRow = !USE_API_MOCK && typingPeerCount > 0;
  const allowAutoDownloadMedia = !(reduceAutoDownloadOnCellular && isCellularConnection);

  useEffect(() => {
    if (!focusMessageId) return;
    if (!messages.some((m) => m.id === focusMessageId)) return;
    messageListRef.current?.scrollToMessage(focusMessageId);
  }, [focusMessageId, messages]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.chatRoomBackground }}>
      <ChatRoomHeader
        title={displayName}
        status={statusText}
        avatarUrl={displayAvatar}
        onBack={() => router.back()}
        isGroup={isGroup}
        onTitlePress={isGroup ? openGroupInfo : undefined}
        onMorePress={isGroup ? openGroupInfo : undefined}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {messagesLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : messagesError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 }}>
            <AppText variant="subhead" color="textSecondary" style={{ textAlign: "center" }}>
              {messagesError}
            </AppText>
            <Pressable
              onPress={() => void loadMessagesFromApi()}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <AppText variant="subhead" style={{ color: colors.textInverse, fontWeight: "600" }}>
                Thử lại
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            {!USE_API_MOCK && !isGroup && directSendGuard.bannerKind === "blocked_by_me" ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#fee2e2" }}>
                <AppText variant="caption" style={{ color: "#991b1b", textAlign: "center" }}>
                  Bạn đã chặn người này. Tin nhắn không được gửi đi.
                </AppText>
              </View>
            ) : null}
            {!USE_API_MOCK && !isGroup && directSendGuard.bannerKind === "blocked_me" ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#fee2e2" }}>
                <AppText variant="caption" style={{ color: "#991b1b", textAlign: "center" }}>
                  Bạn đã bị chặn. Không thể gửi tin nhắn trong cuộc trò chuyện này.
                </AppText>
              </View>
            ) : null}
            {!USE_API_MOCK && !isGroup && directSendGuard.bannerKind === "stranger" ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#fef3c7" }}>
                <AppText variant="caption" style={{ color: "#78350f", textAlign: "center" }}>
                  Cảnh báo: {displayName} chưa là bạn bè hoặc chưa chấp nhận lời mời. Bạn vẫn có thể nhắn tin — hãy cẩn trọng với
                  nội dung từ người lạ.
                </AppText>
              </View>
            ) : null}
            {!USE_API_MOCK && isGroup && groupSendGuard.banner ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#e0f2fe" }}>
                <AppText variant="caption" style={{ color: "#075985", textAlign: "center" }}>
                  {groupSendGuard.banner}
                </AppText>
              </View>
            ) : null}
            {!USE_API_MOCK && socketStatus.state !== "connected" ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#fff7ed" }}>
                <AppText variant="caption" style={{ color: "#9a3412", textAlign: "center" }}>
                  {socketStatus.state === "reconnecting" || socketStatus.state === "connecting"
                    ? socketStatus.detail ?? "Đang kết nối lại realtime..."
                    : "Mất kết nối realtime. Tin nhắn sẽ được xếp hàng và gửi lại khi có mạng."}
                </AppText>
              </View>
            ) : null}
            {!USE_API_MOCK ? (
              <Pressable
                style={{ marginHorizontal: 12, marginBottom: 6, padding: 8, borderRadius: 8, backgroundColor: "#f3f4f6" }}
                onPress={() => {
                  const next = !reduceAutoDownloadOnCellular;
                  setReduceAutoDownloadOnCellular(next);
                  void appStorage.setItem(CHAT_PREF_REDUCE_AUTO_DOWNLOAD_ON_CELLULAR, next ? "1" : "0");
                }}
              >
                <AppText variant="caption" style={{ textAlign: "center", color: "#374151" }}>
                  Tiết kiệm data 4G: {reduceAutoDownloadOnCellular ? "Bật" : "Tắt"}
                </AppText>
              </Pressable>
            ) : null}
            {voiceDraftNotice ? (
              <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 8, backgroundColor: "#eff6ff" }}>
                <AppText variant="caption" style={{ color: "#1d4ed8", textAlign: "center" }}>
                  {voiceDraftNotice}
                </AppText>
              </View>
            ) : null}
            <MessageList
              ref={messageListRef}
              threadKey={id}
              messages={messages}
              peerAvatarUrl={displayAvatar}
              peerName={displayName}
              hasOlderMessages={Boolean(nextCursor)}
              loadingOlder={loadingOlder}
              onNearTopLoadOlder={() => void loadOlderMessages()}
              onMessagePress={onMessagePress}
              onMessageLongPress={onMessageLongPress}
              onImagePress={openImageViewer}
              onReactionEmoji={onReactionEmoji}
              onSwipeReply={(m) => {
                if (m.kind === "groupEvent") return;
                void Haptics.selectionAsync();
                setReplyingTo(toReplyRef(m, displayName));
              }}
              autoLoadMedia={allowAutoDownloadMedia}
            />
          </>
        )}
        {showTypingRow ? (
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <TypingIndicator
              visible
              label={
                isGroup
                  ? typingPeerCount > 1
                    ? `${typingPeerCount} người đang nhập…`
                    : "Đang soạn tin nhắn…"
                  : `${displayName} đang nhập…`
              }
            />
          </View>
        ) : null}
        <MessageInputBar
          value={draft}
          onChangeText={setDraft}
          onSend={() => void send()}
          bottomInset={insets.bottom}
          disabled={!USE_API_MOCK && !canSendInThread}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onOpenAttachment={() => setAttachmentOpen(true)}
          onOpenEmoji={() => setEmojiOpen(true)}
          mentionCandidates={mentionCandidates}
          onToggleVoiceRecording={toggleVoiceRecording}
          isVoiceRecording={voiceRecording}
          voiceRecordingDurationSec={voiceRecordingDurationSec}
          onCancelVoiceRecording={cancelVoiceRecording}
        />
      </KeyboardAvoidingView>

      <ImageViewerModal visible={viewerOpen} imageUri={viewerUri} onClose={closeImageViewer} />

      <FilePreviewModal
        visible={filePreview !== null}
        title={filePreview?.title ?? ""}
        embedUrl={filePreview?.embedUrl ?? null}
        downloadUrl={filePreview?.downloadUrl ?? null}
        onClose={() => setFilePreview(null)}
      />

      <ReactionPickerSheet
        visible={reactionTargetId !== null}
        onClose={() => setReactionTargetId(null)}
        onPick={onReactionPick}
      />

      <MessageActionsSheet
        visible={actionTarget !== null}
        onClose={() => setActionTarget(null)}
        onAction={handleAction}
        actions={actionItems}
      />

      <ForwardConversationSheet
        visible={forwardOpen}
        loading={forwardBusy}
        targets={forwardTargets}
        onClose={() => setForwardOpen(false)}
        onPick={(conversationId) => void onForwardPick(conversationId)}
      />

      <AttachmentSheet
        visible={attachmentOpen}
        onClose={() => setAttachmentOpen(false)}
        onPick={onAttachmentPick}
      />

      <EmojiPickerSheet visible={emojiOpen} onClose={() => setEmojiOpen(false)} onPick={onEmojiPick} />

      <StickerPickerSheet visible={stickerOpen} onClose={() => setStickerOpen(false)} onPick={onStickerPick} />
    </SafeAreaView>
  );
}
