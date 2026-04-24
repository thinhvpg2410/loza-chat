import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, SectionList, View } from "react-native";

import { AppText } from "@ui/AppText";

import type { MockConversation } from "@/constants/mockData";
import { ChatListItem, ChatListSkeleton, ChatSearchBar } from "@components/chat";
import { AppSectionHeader, AppTabScreen, EmptyState, ShellHeader } from "@components/shell";
import { filterConversations, sortConversationsForDisplay } from "@features/chat-list";
import { useChatStore } from "@/store/chatStore";
import { colors, spacing } from "@theme";

type Section = { title: string; data: MockConversation[] };

export default function ChatsTabScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const conversations = useChatStore((s) => s.conversations);
  const loading = useChatStore((s) => s.loading);
  const hasLoadedOnce = useChatStore((s) => s.hasLoadedOnce);
  const fetchError = useChatStore((s) => s.fetchError);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const filteredSorted = useMemo(() => {
    const f = filterConversations(conversations, query);
    return sortConversationsForDisplay(f);
  }, [conversations, query]);

  const sections: Section[] = useMemo(() => {
    const q = query.trim();
    if (q) {
      return filteredSorted.length ? [{ title: "Kết quả", data: filteredSorted }] : [];
    }
    const pinned = filteredSorted.filter((c) => c.isPinned);
    const rest = filteredSorted.filter((c) => !c.isPinned);
    const out: Section[] = [];
    if (pinned.length) out.push({ title: "Ưu tiên", data: pinned });
    if (rest.length) out.push({ title: "Trò chuyện", data: rest });
    return out;
  }, [filteredSorted, query]);

  const showInitialSkeleton = loading && !hasLoadedOnce;
  const listEmpty =
    !loading &&
    hasLoadedOnce &&
    !fetchError &&
    filteredSorted.length === 0 &&
    conversations.length === 0;
  const searchEmpty =
    !loading && hasLoadedOnce && query.trim().length > 0 && filteredSorted.length === 0;

  const openChat = useCallback(
    (item: MockConversation) => {
      router.push({
        pathname: "/main/chat/[id]",
        params: {
          id: item.id,
          title: encodeURIComponent(item.name),
          peerAvatar: encodeURIComponent(item.avatarUrl),
          peerId: item.directPeerId ?? "",
        },
      });
    },
    [router],
  );

  const openNewConversationMenu = useCallback(() => {
    Alert.alert("Bắt đầu", "Chọn người để nhắn tin hoặc tạo nhóm.", [
      { text: "Trò chuyện mới", onPress: () => router.push("/main/start-conversation") },
      { text: "Tạo nhóm", onPress: () => router.push("/main/group/create") },
      { text: "Tìm kiếm", onPress: () => router.push("/main/search") },
      { text: "Hủy", style: "cancel" },
    ]);
  }, [router]);

  const headerRight = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Pressable
        accessibilityLabel="Quét QR"
        hitSlop={8}
        onPress={() => router.push("/main/qr-login-scan")}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
      >
        <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
      </Pressable>
      <Pressable
        accessibilityLabel="Tạo mới"
        hitSlop={8}
        onPress={openNewConversationMenu}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
      >
        <Ionicons name="add-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );

  const fabBottom = tabBarHeight + spacing.md;

  return (
    <AppTabScreen>
      <ShellHeader title="Tin nhắn" right={headerRight} />

      <ChatSearchBar
        value={query}
        onChangeText={setQuery}
        onSubmitFullSearch={() => router.push("/main/search")}
      />

      {fetchError && !loading ? (
        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md }}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được danh sách"
            description={fetchError}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử lại"
            onPress={() => void fetchConversations()}
            style={({ pressed }) => ({
              alignSelf: "center",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: 8,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <AppText variant="subhead" style={{ color: colors.textInverse, fontWeight: "600" }}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : showInitialSkeleton ? (
        <ChatListSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatListItem item={item} onPress={() => openChat(item)} />}
          renderSectionHeader={({ section: { title } }) => <AppSectionHeader title={title} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            sections.length === 0
              ? { flexGrow: 1, paddingBottom: fabBottom + 48 }
              : { paddingBottom: fabBottom + 48 }
          }
          ListEmptyComponent={
            listEmpty ? (
              <EmptyState
                icon="chatbubbles-outline"
                title="Chưa có trò chuyện"
                description="Hãy kết bạn để có thể bắt đầu trò chuyện."
              />
            ) : searchEmpty ? (
              <EmptyState
                icon="search-outline"
                title="Không tìm thấy"
                description="Thử từ khóa khác hoặc tìm trong toàn app."
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Soạn tin nhắn"
        onPress={openNewConversationMenu}
        style={({ pressed }) => ({
          position: "absolute",
          right: spacing.md,
          bottom: fabBottom,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.88 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 3,
        })}
      >
        <Ionicons name="create-outline" size={22} color={colors.textInverse} />
      </Pressable>
    </AppTabScreen>
  );
}
