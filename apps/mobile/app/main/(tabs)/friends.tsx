import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, View } from "react-native";

import { ChatSearchBar } from "@components/chat";
import { FriendRow } from "@components/friends";
import { AppTabScreen, AppSectionHeader, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import type { MockFriend } from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import { MOCK_FRIENDS, MOCK_INCOMING_FRIEND_REQUESTS } from "@/constants/mockData";
import { buildFriendSections } from "@features/friends";
import { openDirectChatWithPeer } from "@/services/conversations/openDirectChat";
import { useFriendsStore } from "@/store/friendsStore";
import { colors, spacing } from "@theme";

type Section = { title: string; data: MockFriend[] };

export default function FriendsTabScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const apiFriends = useFriendsStore((s) => s.friends);
  const apiIncoming = useFriendsStore((s) => s.incoming);
  const apiError = useFriendsStore((s) => s.error);
  const apiLoading = useFriendsStore((s) => s.loading);
  const apiLoaded = useFriendsStore((s) => s.hasLoadedOnce);
  const refreshFriends = useFriendsStore((s) => s.refresh);

  useEffect(() => {
    if (!USE_API_MOCK) {
      void refreshFriends();
    }
  }, [refreshFriends]);

  useFocusEffect(
    useCallback(() => {
      if (!USE_API_MOCK) {
        void refreshFriends();
      }
    }, [refreshFriends]),
  );

  const listFriends = USE_API_MOCK ? MOCK_FRIENDS : apiFriends;
  const requestBadge = USE_API_MOCK ? MOCK_INCOMING_FRIEND_REQUESTS.length : apiIncoming.length;

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
      await new Promise((r) => setTimeout(r, 600));
    } else {
      await refreshFriends();
    }
    setRefreshing(false);
  }, [refreshFriends]);

  const openProfile = useCallback(
    (u: MockFriend) => {
      router.push({
        pathname: "/main/friends/user/[id]",
        params: {
          id: u.id,
          name: encodeURIComponent(u.name),
          avatarUrl: encodeURIComponent(u.avatarUrl ?? ""),
        },
      });
    },
    [router],
  );

  const onMessageFriend = useCallback(
    (u: MockFriend) => {
      void openDirectChatWithPeer(router, {
        peerUserId: u.id,
        displayName: u.name,
        avatarUrl: u.avatarUrl,
      });
    },
    [router],
  );

  const fabBottom = tabBarHeight + spacing.md;

  const headerRight = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Pressable
        accessibilityLabel="Lời mời kết bạn"
        hitSlop={8}
        onPress={() => router.push("/main/friends/requests")}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs, position: "relative" })}
      >
        <Ionicons name="mail-outline" size={20} color={colors.primary} />
        {requestBadge > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <AppText variant="micro" color="textInverse" style={{ fontSize: 10, fontWeight: "700" }}>
              {requestBadge > 9 ? "9+" : requestBadge}
            </AppText>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityLabel="Thêm bạn"
        hitSlop={8}
        onPress={() => router.push("/main/friends/add")}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );

  const searchEmpty = query.trim().length > 0 && sections.length === 0;
  const showListError = !USE_API_MOCK && apiError && !apiLoading && apiLoaded;

  return (
    <AppTabScreen>
      <ShellHeader title="Bạn bè" right={headerRight} />

      <ChatSearchBar value={query} onChangeText={setQuery} placeholder="Tìm bạn" />

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs, flexDirection: "row", gap: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/main/friends/add")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.75 : 1,
            alignItems: "center",
            width: 68,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: colors.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
          </View>
          <AppText variant="micro" color="textSecondary" style={{ marginTop: 4, textAlign: "center" }}>
            Thêm bạn
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/main/friends/requests")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.75 : 1,
            alignItems: "center",
            width: 68,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="mail-unread-outline" size={18} color={colors.primary} />
          </View>
          <AppText variant="micro" color="textSecondary" style={{ marginTop: 4, textAlign: "center" }}>
            Lời mời
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
            <FriendRow
              user={item}
              onPress={() => openProfile(item)}
              onMessagePress={() => void onMessageFriend(item)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => <AppSectionHeader title={title} compact />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            sections.length === 0
              ? { flexGrow: 1, paddingBottom: fabBottom + 24 }
              : { paddingBottom: fabBottom + 24 }
          }
          ListEmptyComponent={
            searchEmpty ? (
              <EmptyState icon="search-outline" title="Không tìm thấy" description="Thử từ khóa khác." />
            ) : listFriends.length === 0 && !apiLoading && (USE_API_MOCK || apiLoaded) ? (
              <EmptyState icon="people-outline" title="Chưa có bạn bè" description="Thêm bạn để bắt đầu kết nối." />
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
