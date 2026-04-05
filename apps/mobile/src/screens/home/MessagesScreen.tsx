import { ChatListSkeleton } from "@/components/ChatListSkeleton";
import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { useMainStackNavigation } from "@/hooks/useMainStackNavigation";
import type { MockConversation } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useChatStore } from "@/store/chatStore";

type Segment = "priority" | "other";

export function MessagesScreen() {
  const mainNav = useMainStackNavigation();
  const conversations = useChatStore((s) => s.conversations);
  const loading = useChatStore((s) => s.loading);
  const hasLoadedOnce = useChatStore((s) => s.hasLoadedOnce);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [segment, setSegment] = useState<Segment>("priority");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (segment === "priority") return conversations.filter((c) => c.isPinned);
    return conversations.filter((c) => !c.isPinned);
  }, [conversations, segment]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const openChat = useCallback(
    (item: MockConversation) => {
      mainNav.navigate("ChatDetail", {
        conversationId: item.id,
        title: item.name,
        peerAvatarUrl: item.avatarUrl,
        peerId: `user-${item.id}`,
        isOnline: Number(item.id) % 3 !== 0,
      });
    },
    [mainNav],
  );

  const headerIcons = (
    <>
      <Pressable
        accessibilityLabel="Quét QR"
        className="h-10 w-10 items-center justify-center rounded-full active:bg-white/20"
        onPress={() => {}}
      >
        <Ionicons name="qr-code-outline" size={24} color="#fff" />
      </Pressable>
      <Pressable
        accessibilityLabel="Tạo mới"
        className="h-10 w-10 items-center justify-center rounded-full active:bg-white/20"
        onPress={() => {}}
      >
        <Ionicons name="add-outline" size={28} color="#fff" />
      </Pressable>
    </>
  );

  const showSkeleton = loading && !hasLoadedOnce;

  return (
    <SafeAreaView className="flex-1 bg-zalo" edges={["top"]}>
      <Header
        onSearchPress={() => mainNav.navigate("Search")}
        rightIcons={headerIcons}
      />

      <View className="flex-1 bg-white dark:bg-slate-950">
        <View className="border-b border-slate-100 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cloud-outline" size={18} color="#0085FF" />
            <Text className="flex-1 text-xs text-slate-600 dark:text-slate-300">
              Đang chuẩn bị dữ liệu để sao lưu... 74%
            </Text>
          </View>
          <View className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <View className="h-full w-[74%] rounded-full bg-zalo" />
          </View>
        </View>

        <View className="flex-row border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          {(
            [
              { key: "priority" as const, label: "Ưu tiên" },
              { key: "other" as const, label: "Khác" },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setSegment(tab.key)}
              className="relative flex-1 items-center py-3 active:opacity-70"
            >
              <Text
                className={[
                  "text-base",
                  segment === tab.key
                    ? "font-bold text-slate-900 dark:text-white"
                    : "font-medium text-slate-400",
                ].join(" ")}
              >
                {tab.label}
              </Text>
              {segment === tab.key ? (
                <View className="absolute bottom-0 h-0.5 w-12 rounded-full bg-slate-900 dark:bg-white" />
              ) : null}
            </Pressable>
          ))}
        </View>

        {showSkeleton ? (
          <ChatListSkeleton />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ConversationItem item={item} onPress={() => openChat(item)} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
            ListEmptyComponent={
              <EmptyState
                title="Chưa có cuộc trò chuyện"
                description={
                  segment === "priority"
                    ? "Ghim cuộc trò chuyện quan trọng để hiển thị tại đây."
                    : "Các cuộc trò chuyện khác sẽ hiển thị tại đây."
                }
              />
            }
            contentContainerClassName={filtered.length === 0 ? "flex-grow" : "pb-4"}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
