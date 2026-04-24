import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from "react-native";

import { BlockedUserRow } from "@components/friends";
import { AppTabScreen, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import type { MockFriend } from "@/constants/mockData";
import { mapPublicProfileToMockFriend } from "@features/friends/userMapping";
import { getApiErrorMessage } from "@/services/api/api";
import { fetchBlockedUsersApi, unblockUserApi } from "@/services/blocks/blocksApi";
import { useFriendsStore } from "@/store/friendsStore";
import { colors, spacing } from "@theme";

type RowModel = {
  userId: string;
  peer: MockFriend;
  blockedSubtitle: string;
};

function formatBlockedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `Đã chặn · ${d.toLocaleDateString("vi-VN")}`;
  } catch {
    return "";
  }
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<RowModel[]>([]);
  const [loading, setLoading] = useState(!USE_API_MOCK);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshFriends = useFriendsStore((s) => s.refresh);

  const load = useCallback(async () => {
    if (USE_API_MOCK) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    try {
      const blocks = await fetchBlockedUsersApi();
      setRows(
        blocks.map((b) => ({
          userId: b.user.id,
          peer: mapPublicProfileToMockFriend(b.user),
          blockedSubtitle: formatBlockedAt(b.blockedAt),
        })),
      );
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openProfile = useCallback(
    (peer: RowModel["peer"]) => {
      router.push({
        pathname: "/main/friends/user/[id]",
        params: {
          id: peer.id,
          name: encodeURIComponent(peer.name),
          avatarUrl: encodeURIComponent(peer.avatarUrl ?? ""),
        },
      });
    },
    [router],
  );

  const onUnblock = useCallback(
    (userId: string, displayName: string) => {
      Alert.alert("Bỏ chặn", `Bỏ chặn ${displayName}?`, [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ chặn",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (USE_API_MOCK) return;
              try {
                await unblockUserApi(userId);
                setRows((prev) => prev.filter((r) => r.userId !== userId));
                await refreshFriends();
              } catch (e) {
                Alert.alert("Lỗi", getApiErrorMessage(e));
              }
            })();
          },
        },
      ]);
    },
    [refreshFriends],
  );

  if (USE_API_MOCK) {
    return (
      <AppTabScreen edges={["top", "left", "right", "bottom"]}>
        <ShellHeader
          title="Đã chặn"
          left={
            <Pressable
              accessibilityLabel="Quay lại"
              hitSlop={8}
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
          }
        />
        <View style={{ padding: spacing.lg, flex: 1 }}>
          <EmptyState
            icon="ban-outline"
            title="Chế độ demo"
            description="Đăng nhập API để xem và quản lý danh sách chặn."
          />
        </View>
      </AppTabScreen>
    );
  }

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Đã chặn"
        left={
          <Pressable
            accessibilityLabel="Quay lại"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
          <EmptyState icon="cloud-offline-outline" title="Không tải được danh sách" description={error} />
          <Pressable
            onPress={() => {
              setLoading(true);
              void load();
            }}
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
        <FlatList
          data={rows}
          keyExtractor={(item) => item.userId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={rows.length === 0 ? { flexGrow: 1 } : { paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState icon="ban-outline" title="Chưa chặn ai" description="Người bạn chặn sẽ hiển thị tại đây." />
          }
          renderItem={({ item }) => (
            <BlockedUserRow
              user={item.peer}
              subtitle={item.blockedSubtitle}
              onOpenProfile={() => openProfile(item.peer)}
              onUnblock={() => onUnblock(item.userId, item.peer.name)}
            />
          )}
        />
      )}
    </AppTabScreen>
  );
}
