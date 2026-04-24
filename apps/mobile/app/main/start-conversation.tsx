import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, View } from "react-native";

import { ChatSearchBar } from "@components/chat";
import { FriendRow } from "@components/friends";
import { AppSectionHeader, AppTabScreen, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import type { MockFriend } from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import { MOCK_FRIENDS } from "@/constants/mockData";
import { buildFriendSections } from "@features/friends";
import { openDirectChatWithPeer } from "@/services/conversations/openDirectChat";
import { useFriendsStore } from "@/store/friendsStore";
import { colors, spacing } from "@theme";

type Section = { title: string; data: MockFriend[] };

export default function StartConversationScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const apiFriends = useFriendsStore((s) => s.friends);
  const apiError = useFriendsStore((s) => s.error);
  const apiLoading = useFriendsStore((s) => s.loading);
  const apiLoaded = useFriendsStore((s) => s.hasLoadedOnce);
  const refreshFriends = useFriendsStore((s) => s.refresh);

  useEffect(() => {
    if (!USE_API_MOCK) {
      void refreshFriends();
    }
  }, [refreshFriends]);

  const listFriends = USE_API_MOCK ? MOCK_FRIENDS : apiFriends;

  const sections: Section[] = useMemo(() => {
    const q = query.trim();
    if (!q.length) return buildFriendSections(listFriends, "");
    const grouped = buildFriendSections(listFriends, q);
    const flat = grouped.flatMap((s) => s.data);
    if (!flat.length) return [];
    return [{ title: "Kết quả", data: flat }];
  }, [query, listFriends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (USE_API_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
    } else {
      await refreshFriends();
    }
    setRefreshing(false);
  }, [refreshFriends]);

  const openChat = useCallback(
    (u: MockFriend) => {
      void openDirectChatWithPeer(router, {
        peerUserId: u.id,
        displayName: u.name,
        avatarUrl: u.avatarUrl,
      });
    },
    [router],
  );

  const searchEmpty = query.trim().length > 0 && sections.length === 0;
  const showListError = !USE_API_MOCK && apiError && !apiLoading && apiLoaded;

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Trò chuyện mới"
        bottomPadding={spacing.xs}
        left={
          <Pressable
            accessibilityLabel="Đóng"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <AppText variant="subhead" color="primary" style={{ fontWeight: "600" }}>
              Đóng
            </AppText>
          </Pressable>
        }
      />

      <ChatSearchBar value={query} onChangeText={setQuery} placeholder="Tìm bạn bè" />

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
        <Pressable
          onPress={() => router.push("/main/group/create")}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <AppText variant="subhead" color="primary" style={{ fontWeight: "700" }}>
            Tạo nhóm mới
          </AppText>
        </Pressable>
      </View>

      {showListError ? (
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}>
          <EmptyState icon="cloud-offline-outline" title="Không tải được danh sách" description={apiError} />
          <Pressable
            onPress={() => void refreshFriends()}
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
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendRow user={item} onPress={() => void openChat(item)} />
          )}
          renderSectionHeader={({ section: { title } }) => <AppSectionHeader title={title} compact />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            sections.length === 0 ? { flexGrow: 1, paddingBottom: spacing.xxl } : { paddingBottom: spacing.xxl }
          }
          ListEmptyComponent={
            searchEmpty ? (
              <EmptyState icon="search-outline" title="Không tìm thấy" description="Thử từ khóa khác." />
            ) : listFriends.length === 0 && !apiLoading && (USE_API_MOCK || apiLoaded) ? (
              <EmptyState
                icon="people-outline"
                title="Chưa có bạn bè"
                description="Thêm bạn trước khi bắt đầu trò chuyện."
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
    </AppTabScreen>
  );
}
