import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AttachmentSheet,
  type AttachmentKind,
  ChatRoomHeader,
  ImageViewerModal,
  MessageActionsSheet,
  type MessageActionId,
  MessageInputBar,
  MessageList,
  type MockSticker,
  ReactionPickerSheet,
  StickerPickerSheet,
  TypingIndicator,
} from "@components/chat";
import { getMockThreadMessages, toggleReactionOnMessage, type ChatRoomMessage, type ReplyReference } from "@features/chat-room";
import { MOCK_CONVERSATIONS } from "@/constants/mockData";
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

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    peerAvatar?: string;
    peerId?: string;
  }>();

  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const title = useMemo(() => decodeParam(params.title) ?? `Chat ${id}`, [params.title, id]);
  const peerAvatar = decodeParam(params.peerAvatar);

  const peerMeta = useMemo(() => MOCK_CONVERSATIONS.find((c) => c.id === id), [id]);
  const isGroup = peerMeta?.kind === "group";
  const memberCount = peerMeta?.memberCount ?? 0;

  const displayName = peerMeta?.name ?? title;
  const displayAvatar = peerAvatar ?? peerMeta?.avatarUrl;

  const statusText = useMemo(() => {
    if (isGroup) return `${memberCount} thành viên`;
    if (peerMeta?.isOnline) return "Đang hoạt động";
    return "Vừa truy cập";
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

  const [messages, setMessages] = useState<ChatRoomMessage[]>(() => getMockThreadMessages(id));
  const [draft, setDraft] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);

  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);

  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<ChatRoomMessage | null>(null);

  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);

  useEffect(() => {
    setMessages(getMockThreadMessages(id));
    setReplyingTo(null);
  }, [id]);

  useEffect(() => {
    const show = setTimeout(() => setPeerTyping(true), 1800);
    const hide = setTimeout(() => setPeerTyping(false), 5200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [id]);

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
    setReactionTargetId(m.id);
  }, []);

  const onMessageLongPress = useCallback((m: ChatRoomMessage) => {
    setActionTarget(m);
  }, []);

  const applyReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions: toggleReactionOnMessage(msg.reactions, emoji) }
          : msg,
      ),
    );
  }, []);

  const onReactionEmoji = useCallback(
    (messageId: string, emoji: string) => {
      applyReaction(messageId, emoji);
    },
    [applyReaction],
  );

  const onReactionPick = useCallback(
    (emoji: string) => {
      if (!reactionTargetId) return;
      applyReaction(reactionTargetId, emoji);
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
      } else if (actionId === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      } else if (actionId === "forward") {
        Alert.alert("Chuyển tiếp", "Tính năng đang phát triển.");
      }
    },
    [actionTarget, displayName],
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
    const uri = result.assets[0]?.uri;
    if (!uri) return;

    appendOutgoing({
      id: `local-img-${Date.now()}`,
      conversationId: id,
      senderRole: "me",
      kind: "image",
      imageUrl: uri,
      imageWidth: result.assets[0]?.width ?? 800,
      imageHeight: result.assets[0]?.height ?? 600,
      createdAt: new Date().toISOString(),
      delivery: "delivered",
    });
  }, [appendOutgoing, id]);

  const onAttachmentPick = useCallback(
    (kind: AttachmentKind) => {
      if (kind === "photo") {
        void pickPhoto();
      } else if (kind === "file") {
        appendOutgoing({
          id: `local-file-${Date.now()}`,
          conversationId: id,
          senderRole: "me",
          kind: "file",
          file: { name: "Tai_lieu.pdf", sizeBytes: 512_000, mime: "application/pdf" },
          createdAt: new Date().toISOString(),
          delivery: "delivered",
        });
      } else if (kind === "sticker") {
        setStickerOpen(true);
      } else if (kind === "camera") {
        Alert.alert("Camera", "Placeholder — tích hợp camera sau.");
      }
    },
    [appendOutgoing, id, pickPhoto],
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

  const send = useCallback(() => {
    const body = draft.trim();
    if (!body.length) return;

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
  }, [draft, id, replyingTo]);

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
        <MessageList
          messages={messages}
          peerAvatarUrl={displayAvatar}
          peerName={displayName}
          onMessagePress={onMessagePress}
          onMessageLongPress={onMessageLongPress}
          onImagePress={openImageViewer}
          onReactionEmoji={onReactionEmoji}
        />
        <TypingIndicator visible={peerTyping} />
        <MessageInputBar
          value={draft}
          onChangeText={setDraft}
          onSend={send}
          bottomInset={insets.bottom}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onOpenAttachment={() => setAttachmentOpen(true)}
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
      />

      <AttachmentSheet
        visible={attachmentOpen}
        onClose={() => setAttachmentOpen(false)}
        onPick={onAttachmentPick}
      />

      <StickerPickerSheet visible={stickerOpen} onClose={() => setStickerOpen(false)} onPick={onStickerPick} />
    </SafeAreaView>
  );
}
