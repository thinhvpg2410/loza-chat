import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";
import {
  approveGroupJoinRequestApi,
  approveGroupMemberApi,
  fetchGroupDetailApi,
  fetchGroupJoinQueueApi,
  rejectGroupJoinRequestApi,
  rejectGroupMemberApi,
  type GroupDetailDto,
  type GroupJoinQueueItemDto,
} from "@/services/groups/groupsApi";
import { colors, spacing } from "@theme";

function avatarForUser(detail: GroupDetailDto | null, userId: string): string | undefined {
  if (!detail) return undefined;
  const all = [...detail.members, ...(detail.pendingMembers ?? [])];
  const row = all.find((m) => m.userId === userId);
  return row?.user.avatarUrl ?? undefined;
}

export default function GroupJoinRequestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const conversationId = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const [detail, setDetail] = useState<GroupDetailDto | null>(null);
  const [items, setItems] = useState<GroupJoinQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const nameByUserId = useMemo(() => {
    const m: Record<string, string> = {};
    if (!detail) return m;
    for (const x of detail.members) m[x.userId] = x.user.displayName;
    for (const x of detail.pendingMembers ?? []) m[x.userId] = x.user.displayName;
    return m;
  }, [detail]);

  const load = useCallback(async () => {
    if (USE_API_MOCK || !conversationId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [dRes, qRes] = await Promise.all([
        fetchGroupDetailApi(conversationId),
        fetchGroupJoinQueueApi(conversationId),
      ]);
      setDetail(dRes.group);
      setItems(qRes.items);
    } catch (e) {
      setDetail(null);
      setItems([]);
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canModerate = detail?.myRole === "owner" || detail?.myRole === "admin";

  const onApprove = useCallback(
    (row: GroupJoinQueueItemDto) => {
      if (!conversationId || !canModerate) return;
      setBusyUserId(row.userId);
      const done = () => setBusyUserId(null);
      const run = async () => {
        try {
          if (row.kind === "self_request") {
            const { group } = await approveGroupJoinRequestApi(conversationId, row.userId);
            setDetail(group);
          } else {
            const { group } = await approveGroupMemberApi(conversationId, row.userId);
            setDetail(group);
          }
          const q = await fetchGroupJoinQueueApi(conversationId);
          setItems(q.items);
        } catch (e) {
          Alert.alert("Duyệt", getApiErrorMessage(e));
        } finally {
          done();
        }
      };
      void run();
    },
    [canModerate, conversationId],
  );

  const onReject = useCallback(
    (row: GroupJoinQueueItemDto) => {
      if (!conversationId || !canModerate) return;
      setBusyUserId(row.userId);
      const done = () => setBusyUserId(null);
      const run = async () => {
        try {
          if (row.kind === "self_request") {
            await rejectGroupJoinRequestApi(conversationId, row.userId);
          } else {
            const { group } = await rejectGroupMemberApi(conversationId, row.userId);
            setDetail(group);
          }
          const q = await fetchGroupJoinQueueApi(conversationId);
          setItems(q.items);
        } catch (e) {
          Alert.alert("Từ chối", getApiErrorMessage(e));
        } finally {
          done();
        }
      };
      void run();
    },
    [canModerate, conversationId],
  );

  if (USE_API_MOCK) {
    return (
      <AppTabScreen edges={["top", "left", "right", "bottom"]}>
        <ShellHeader title="Chờ duyệt" bottomPadding={spacing.xs} />
        <View style={styles.centered}>
          <AppText variant="subhead" color="textSecondary">
            Chỉ khả dụng khi tắt mock API.
          </AppText>
        </View>
      </AppTabScreen>
    );
  }

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Chờ duyệt"
        bottomPadding={spacing.xs}
        left={
          <Pressable
            accessibilityLabel="Quay lại"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      {!canModerate && detail ? (
        <View style={[styles.centered, { paddingHorizontal: spacing.lg }]}>
          <AppText variant="subhead" color="textSecondary" style={{ textAlign: "center" }}>
            Bạn không có quyền duyệt thành viên trong nhóm này.
          </AppText>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={[styles.centered, { paddingHorizontal: spacing.lg, gap: spacing.sm }]}>
          <AppText variant="subhead" color="textSecondary" style={{ textAlign: "center" }}>
            {error}
          </AppText>
          <Pressable
            onPress={() => void load()}
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
        <FlatList
          data={items}
          keyExtractor={(it) => `${it.kind}-${it.userId}`}
          contentContainerStyle={items.length === 0 ? styles.emptyGrow : styles.listPad}
          refreshing={false}
          onRefresh={() => void load()}
          ListEmptyComponent={
            <AppText variant="subhead" color="textMuted" style={{ textAlign: "center", paddingTop: spacing.xl }}>
              Không có yêu cầu chờ duyệt.
            </AppText>
          }
          renderItem={({ item }) => {
            const name = nameByUserId[item.userId] ?? item.userId.slice(0, 8);
            const label = item.kind === "self_request" ? "Xin vào nhóm" : "Được mời (chờ)";
            const busy = busyUserId === item.userId;
            return (
              <View style={styles.row}>
                <AppAvatar name={name} uri={avatarForUser(detail, item.userId)} size="md" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="subhead" numberOfLines={1} style={{ fontWeight: "600" }}>
                    {name}
                  </AppText>
                  <AppText variant="micro" color="textMuted">
                    {label}
                  </AppText>
                </View>
                {canModerate ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      disabled={busy}
                      onPress={() => onApprove(item)}
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnPrimary,
                        { opacity: busy ? 0.5 : pressed ? 0.85 : 1 },
                      ]}
                    >
                      <AppText variant="caption" style={{ fontWeight: "700", color: colors.textInverse }}>
                        Duyệt
                      </AppText>
                    </Pressable>
                    <Pressable
                      disabled={busy}
                      onPress={() => onReject(item)}
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnGhost,
                        { opacity: busy ? 0.5 : pressed ? 0.85 : 1 },
                      ]}
                    >
                      <AppText variant="caption" style={{ fontWeight: "700", color: colors.danger }}>
                        Từ chối
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyGrow: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  listPad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnGhost: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
