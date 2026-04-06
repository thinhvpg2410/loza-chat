import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, View } from "react-native";

import { ChatSearchBar } from "@components/chat";
import { FriendRow } from "@components/friends";
import { AppTabScreen, AppSectionHeader, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import type { MockFriend } from "@/constants/mockData";
import { MOCK_FRIENDS, MOCK_INCOMING_FRIEND_REQUESTS } from "@/constants/mockData";
import { buildFriendSections } from "@features/friends";
import { colors, spacing } from "@theme";

type Section = { title: string; data: MockFriend[] };

export default function FriendsTabScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const requestBadge = MOCK_INCOMING_FRIEND_REQUESTS.length;

  const sections: Section[] = useMemo(() => {
    const q = query.trim();
    if (!q.length) return buildFriendSections(MOCK_FRIENDS, "");
    const grouped = buildFriendSections(MOCK_FRIENDS, q);
    const flat = grouped.flatMap((s) => s.data);
    if (!flat.length) return [];
    return [{ title: "Kết quả", data: flat }];
  }, [query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const openProfile = useCallback(
    (u: MockFriend) => {
      router.push({
        pathname: "/main/friends/user/[id]",
        params: {
          id: u.id,
          name: encodeURIComponent(u.name),
          avatarUrl: encodeURIComponent(u.avatarUrl),
        },
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FriendRow user={item} onPress={() => openProfile(item)} />}
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
          ) : MOCK_FRIENDS.length === 0 ? (
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
    </AppTabScreen>
  );
}
