import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatRoomHeader, MessageInputBar, MessageList, TypingIndicator } from "@components/chat";
import type { ChatRoomMessage } from "@features/chat-room/types";
import { getMockThreadMessages } from "@features/chat-room";
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

  const statusText = useMemo(() => {
    if (peerMeta?.isOnline) return "Đang hoạt động";
    return "Vừa truy cập";
  }, [peerMeta?.isOnline]);

  const displayName = peerMeta?.name ?? title;
  const displayAvatar = peerAvatar ?? peerMeta?.avatarUrl;

  const [messages, setMessages] = useState<ChatRoomMessage[]>(() => getMockThreadMessages(id));
  const [draft, setDraft] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);

  useEffect(() => {
    setMessages(getMockThreadMessages(id));
  }, [id]);

  useEffect(() => {
    const show = setTimeout(() => setPeerTyping(true), 1800);
    const hide = setTimeout(() => setPeerTyping(false), 5200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [id]);

  const send = useCallback(() => {
    const body = draft.trim();
    if (!body.length) return;

    const next: ChatRoomMessage = {
      id: `local-${Date.now()}`,
      conversationId: id,
      senderRole: "me",
      body,
      createdAt: new Date().toISOString(),
      delivery: "delivered",
    };

    setMessages((prev) => [...prev, next]);
    setDraft("");
  }, [draft, id]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.chatRoomBackground }}>
      <ChatRoomHeader
        title={displayName}
        status={statusText}
        avatarUrl={displayAvatar}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <MessageList messages={messages} peerAvatarUrl={displayAvatar} peerName={displayName} />
        <TypingIndicator visible={peerTyping} />
        <MessageInputBar value={draft} onChangeText={setDraft} onSend={send} bottomInset={insets.bottom} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
