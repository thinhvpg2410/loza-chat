import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  ImageViewerModal,
  MessageActionsSheet,
  type MessageActionId,
  type MessageActionItem,
  MessageInputBar,
  MessageList,
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
import {
  addMessageReactionApi,
  deleteMessageApi,
  forwardMessageApi,
  recallMessageApi,
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
} from "@/services/socket/socket";
import { uploadLocalFileToAttachment } from "@/services/uploads/directUpload";
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
  }>();

  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const listRow = useChatStore((s) => s.conversations.find((c) => c.id === id));

  const title = useMemo(() => decodeParam(params.title) ?? `Chat ${id}`, [params.title, id]);
  const peerAvatar = decodeParam(params.peerAvatar);
  const paramPeerId = decodeParam(params.peerId) ?? "";
  const directPeerId = paramPeerId || (listRow?.kind === "direct" ? listRow.directPeerId : undefined) || "";

  const peerMeta = useMemo(() => MOCK_CONVERSATIONS.find((c) => c.id === id), [id]);
  const isGroup = listRow?.kind === "group" || peerMeta?.kind === "group";
  const memberCount = listRow?.memberCount ?? peerMeta?.memberCount ?? 0;

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

  const [messages, setMessages] = useState<ChatRoomMessage[]>(() =>
    USE_API_MOCK ? getMockThreadMessages(id) : [],
  );
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(!USE_API_MOCK);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);

  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<ChatRoomMessage | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardBusy, setForwardBusy] = useState(false);

  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);

  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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
      const { messages: rows } = await fetchConversationMessagesPage(id, { limit: 50 });
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

  useEffect(() => {
    if (USE_API_MOCK) return;
    void loadMessagesFromApi();
  }, [loadMessagesFromApi]);

  useFocusEffect(
    useCallback(() => {
      if (USE_API_MOCK || !isChatSocketConfigured() || !id || !viewerId) {
        return () => {};
      }

      setPeerTyping(false);
      emitConversationJoin(id);

      setChatRealtimeHandlers({
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
          setPeerTyping(p.isTyping);
        },
        onReactionUpdated: (p) => {
          if (p.conversationId !== id) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === p.messageId ? { ...m, reactions: mergeReactionsFromSummary(p.summary) } : m,
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
        clearChatRealtimeHandlers();
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
    if (!draft.trim().length) return;
    emitTypingStart(id);
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      emitTypingStop(id);
      typingStopTimer.current = null;
    }, 2000);
    return () => {
      if (typingStopTimer.current) {
        clearTimeout(typingStopTimer.current);
        typingStopTimer.current = null;
      }
    };
  }, [draft, id]);

  const openImageViewer = useCallback((uri: string) => {
    setViewerUri(uri);
    setViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setViewerOpen(false);
    setViewerUri(null);
  }, []);

  const onMessagePress = useCallback((m: ChatRoomMessage) => {
    if (m.kind === "image") return;
    if (m.isRemoved) return;
    setReactionTargetId(m.id);
  }, []);

  const onMessageLongPress = useCallback((m: ChatRoomMessage) => {
    setActionTarget(m);
  }, []);

  const actionItems = useMemo<MessageActionItem[]>(() => {
    if (!actionTarget) return [];
    const own = actionTarget.senderRole === "me";
    const removed = Boolean(actionTarget.isRemoved);
    const items: MessageActionItem[] = [];
    if (!removed) {
      items.push({ id: "reply", label: "Trả lời", icon: "arrow-undo-outline" });
      items.push({ id: "copy", label: "Sao chép", icon: "copy-outline" });
      items.push({ id: "react", label: "Cảm xúc", icon: "happy-outline" });
      items.push({ id: "forward", label: "Chuyển tiếp", icon: "arrow-redo-outline" });
    }
    if (own && !removed) {
      items.push({ id: "recall", label: "Thu hồi", icon: "return-up-back-outline", danger: true });
      items.push({ id: "delete", label: "Xóa", icon: "trash-outline", danger: true });
    }
    return items;
  }, [actionTarget]);

  const forwardTargets = useMemo(
    () =>
      conversations
        .filter((c) => c.kind === "direct")
        .map((c) => ({ id: c.id, name: c.name, avatarUrl: c.avatarUrl })),
    [conversations],
  );

  const applyReaction = useCallback(
    async (messageId: string, emoji: string) => {
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
      try {
        const { summary } = await addMessageReactionApi(messageId, emoji);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reactions: mergeReactionsFromSummary(summary) } : m,
          ),
        );
      } catch (e) {
        Alert.alert("Không thể gửi cảm xúc", getApiErrorMessage(e));
      }
    },
    [],
  );

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
        setReplyingTo(toReplyRef(msg, displayName));
      } else if (actionId === "copy") {
        const text = copyableText(msg);
        if (text.length) await Clipboard.setStringAsync(text);
      } else if (actionId === "react") {
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
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Cần quyền thư viện ảnh để gửi ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
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
      const info = await FileSystem.getInfoAsync(uri);
      const size = info.exists && "size" in info && typeof info.size === "number" ? info.size : 0;
      if (!size) {
        Alert.alert("Ảnh", "Không đọc được kích thước tệp.");
        return;
      }
      const mime = asset.mimeType ?? "image/jpeg";
      const name = asset.fileName ?? "photo.jpg";
      const att = await uploadLocalFileToAttachment({
        fileUri: uri,
        fileName: name,
        mimeType: mime,
        fileSize: size,
        uploadType: "image",
        width: asset.width,
        height: asset.height,
      });
      const { message } = await sendMessageWithAttachmentsApi({
        conversationId: id,
        clientMessageId: newClientMessageId(),
        type: "image",
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
  }, [appendOutgoing, displayName, fetchConversations, id, replyingTo?.id, viewerId]);

  const pickFile = useCallback(async () => {
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
      const info = await FileSystem.getInfoAsync(file.uri);
      const size = info.exists && "size" in info && typeof info.size === "number" ? info.size : file.size ?? 0;
      if (!size) {
        Alert.alert("Tệp", "Không đọc được kích thước tệp.");
        return;
      }
      const mime = file.mimeType ?? "application/octet-stream";
      const name = file.name ?? "file";
      const att = await uploadLocalFileToAttachment({
        fileUri: file.uri,
        fileName: name,
        mimeType: mime,
        fileSize: size,
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
  }, [appendOutgoing, displayName, fetchConversations, id, replyingTo?.id, viewerId]);

  const onAttachmentPick = useCallback(
    (kind: AttachmentKind) => {
      if (kind === "photo") {
        void pickPhoto();
      } else if (kind === "file") {
        void pickFile();
      } else if (kind === "sticker") {
        setStickerOpen(true);
      } else if (kind === "camera") {
        Alert.alert("Camera", "Placeholder — tích hợp camera sau.");
      }
    },
    [pickFile, pickPhoto],
  );

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
    const replyToMessageId = replyingTo?.id;
    setSendBusy(true);
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
      Alert.alert("Gửi tin nhắn", getApiErrorMessage(e));
      setDraft(body);
      if (replyToMessageId) {
        setReplyingTo({
          id: replyToMessageId,
          senderLabel: "Bạn",
          preview: body.slice(0, 80),
        });
      }
    } finally {
      setSendBusy(false);
    }
  }, [draft, displayName, fetchConversations, id, replyingTo, sendBusy, viewerId]);

  const showTypingRow = !USE_API_MOCK && peerTyping && !isGroup && Boolean(directPeerId);

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
            {showTypingRow ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                <TypingIndicator visible label={`${displayName} đang nhập…`} />
              </View>
            ) : null}
            <MessageList
              messages={messages}
              peerAvatarUrl={displayAvatar}
              peerName={displayName}
              onMessagePress={onMessagePress}
              onMessageLongPress={onMessageLongPress}
              onImagePress={openImageViewer}
              onReactionEmoji={onReactionEmoji}
            />
          </>
        )}
        <MessageInputBar
          value={draft}
          onChangeText={setDraft}
          onSend={() => void send()}
          bottomInset={insets.bottom}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onOpenAttachment={() => setAttachmentOpen(true)}
          onOpenEmoji={() => setEmojiOpen(true)}
        />
      </KeyboardAvoidingView>

      <ImageViewerModal visible={viewerOpen} imageUri={viewerUri} onClose={closeImageViewer} />

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
