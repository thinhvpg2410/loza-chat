import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { EmptyState } from "@/components/EmptyState";
import type { MainStackParamList } from "@/navigation/types";
import {
  clearChatSocketHandlers,
  connectChatSocket,
  setChatSocketHandlers,
} from "@/services/socket/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { ChatMessage } from "@/types/chat";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<MainStackParamList, "ChatDetail">;

export function ChatDetailScreen({ route }: Props) {
  const { conversationId, title, peerAvatarUrl, peerId: routePeerId, isOnline } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const myId = useAuthStore((s) => s.user?.id ?? "local-me");
  const accessToken = useAuthStore((s) => s.accessToken);

  const messages = useChatStore((s) => s.messages);
  const typing = useChatStore((s) => s.typing);
  const chatLoading = useChatStore((s) => s.chatLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const resolvedPeerId = routePeerId ?? `peer-${conversationId}`;

  useEffect(() => {
    setChatSocketHandlers({
      onMessageReceive: (m) => useChatStore.getState().receiveMessage(m),
      onTypingStart: () => useChatStore.getState().setTyping(true),
      onTypingStop: () => useChatStore.getState().setTyping(false),
    });
    const disconnect = connectChatSocket(accessToken ?? undefined);
    void useChatStore.getState().openChat(conversationId, { peerId: resolvedPeerId });
    return () => {
      clearChatSocketHandlers();
      disconnect();
      useChatStore.getState().closeChat();
    };
  }, [accessToken, conversationId, resolvedPeerId]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble message={item} isMine={item.kind !== "system" && item.senderId === myId} />
    ),
    [myId],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const listEmpty = () => {
    if (chatLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#0085FF" />
          <Text className="mt-3 text-sm text-slate-500">Đang tải tin nhắn...</Text>
        </View>
      );
    }
    return (
      <EmptyState
        icon="chatbubble-ellipses-outline"
        title="Chưa có tin nhắn"
        description="Gửi lời chào để bắt đầu cuộc trò chuyện."
      />
    );
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <StatusBar style="light" />
      <SafeAreaView className="bg-zalo" edges={["top"]}>
        <View className="min-h-[52px] flex-row items-center px-2 py-2">
          <Pressable
            accessibilityLabel="Quay lại"
            onPress={() => navigation.goBack()}
            className="mr-1 h-10 w-10 items-center justify-center rounded-full active:bg-white/15"
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          {peerAvatarUrl ? (
            <Image
              source={{ uri: peerAvatarUrl }}
              className="mr-2 h-10 w-10 rounded-full bg-white/20"
              contentFit="cover"
            />
          ) : (
            <View className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="person" size={22} color="#fff" />
            </View>
          )}
          <View className="min-w-0 flex-1">
            <Text className="font-semibold text-white" numberOfLines={1}>
              {title}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <View
                className={[
                  "h-2 w-2 rounded-full",
                  isOnline ? "bg-emerald-300" : "bg-white/40",
                ].join(" ")}
              />
              <Text className="text-xs text-white/85">{isOnline ? "Đang hoạt động" : "Offline"}</Text>
            </View>
          </View>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-white/15">
            <Ionicons name="call-outline" size={22} color="#fff" />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-white/15">
            <Ionicons name="videocam-outline" size={22} color="#fff" />
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-white/15">
            <Ionicons name="menu-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 52 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName={messages.length === 0 ? "flex-grow" : "px-3 pb-2 pt-2"}
          ListEmptyComponent={listEmpty}
        />
        <SafeAreaView edges={["bottom"]} className="bg-white dark:bg-slate-950">
          {typing ? <TypingIndicator /> : null}
          <MessageInput onSend={(t) => sendMessage(t)} disabled={chatLoading} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
