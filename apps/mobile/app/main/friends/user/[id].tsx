import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BlockReportSheet, ProfileSharedMediaPlaceholder } from "@components/friends";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { USE_API_MOCK } from "@/constants/env";
import { findUserById, getFriendRelation } from "@features/friends";
import { getApiErrorMessage } from "@/services/api/api";
import { blockUserApi, unblockUserApi } from "@/services/blocks/blocksApi";
import { createOrGetDirectConversationApi } from "@/services/conversations/conversationsApi";
import {
  acceptFriendRequestApi,
  cancelFriendRequestApi,
  fetchIncomingFriendRequestsApi,
  fetchOutgoingFriendRequestsApi,
  rejectFriendRequestApi,
  sendFriendRequestApi,
  unfriendUserApi,
} from "@/services/friends/friendsApi";
import type { RelationshipStatus } from "@/services/users/usersPublicApi";
import { getUserPublicProfileApi } from "@/services/users/usersPublicApi";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useFriendsStore } from "@/store/friendsStore";
import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

const AVATAR = 48;

function decodeParam(v: string | string[] | undefined): string {
  if (typeof v !== "string") return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function metaLine(user: { username?: string; phone?: string }): string {
  const parts: string[] = [];
  if (user.username) parts.push(`@${user.username}`);
  if (user.phone) parts.push(user.phone);
  return parts.join(" · ");
}

function isNotFoundError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}

type ProfileUser = {
  id: string;
  name: string;
  avatarUrl: string;
  username?: string;
  phone?: string;
  subtitle?: string;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.user?.id ?? "");
  const refreshFriends = useFriendsStore((s) => s.refresh);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    avatarUrl?: string;
    preBlockedByMe?: string;
    preBlockedMe?: string;
  }>();
  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const nameFromRoute = decodeParam(params.name);
  const avatarFromRoute = decodeParam(params.avatarUrl);
  const preBlockedByMe = decodeParam(params.preBlockedByMe) === "1";
  const preBlockedMe = decodeParam(params.preBlockedMe) === "1";

  const resolved = useMemo(() => (USE_API_MOCK ? findUserById(id) : undefined), [id]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [localAddedPending, setLocalAddedPending] = useState(false);
  const [blockedMock, setBlockedMock] = useState(false);

  const [apiLoading, setApiLoading] = useState(!USE_API_MOCK && !preBlockedByMe);
  const [apiError, setApiError] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<RelationshipStatus | null>(
    preBlockedByMe ? "blocked_by_me" : null,
  );
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(() => {
    if (preBlockedByMe) {
      return {
        id,
        name: nameFromRoute || "Người dùng",
        avatarUrl: avatarFromRoute,
        username: undefined,
        subtitle: undefined,
      };
    }
    return null;
  });
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null);
  const [outgoingRequestId, setOutgoingRequestId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (USE_API_MOCK || preBlockedByMe || !id) return;

    let cancelled = false;
    (async () => {
      setApiLoading(true);
      setApiError(null);
      try {
        const data = await getUserPublicProfileApi(id);
        if (cancelled) return;
        const p = data.profile;
        setRelationship(data.relationshipStatus);
        setProfileUser({
          id: p.id,
          name: p.displayName?.trim() || "Người dùng",
          avatarUrl: p.avatarUrl ?? "",
          username: p.username ?? undefined,
          subtitle: p.statusMessage ?? undefined,
        });
      } catch (e) {
        if (cancelled) return;
        if (isNotFoundError(e)) {
          setApiError("Không tìm thấy hồ sơ hoặc không thể xem.");
          setRelationship(null);
          setProfileUser(
            nameFromRoute
              ? {
                  id,
                  name: nameFromRoute,
                  avatarUrl: avatarFromRoute,
                }
              : null,
          );
        } else {
          setApiError(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [avatarFromRoute, id, nameFromRoute, preBlockedByMe]);

  useEffect(() => {
    if (USE_API_MOCK || !id || relationship !== "incoming_request") return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchIncomingFriendRequestsApi();
        if (cancelled) return;
        const hit = rows.find((r) => r.sender.id === id);
        setIncomingRequestId(hit?.id ?? null);
      } catch {
        if (!cancelled) setIncomingRequestId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, relationship]);

  useEffect(() => {
    if (USE_API_MOCK || !id || relationship !== "outgoing_request") return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchOutgoingFriendRequestsApi();
        if (cancelled) return;
        const hit = rows.find((r) => r.receiver.id === id);
        setOutgoingRequestId(hit?.id ?? null);
      } catch {
        if (!cancelled) setOutgoingRequestId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, relationship]);

  const mockUser = useMemo(() => {
    if (resolved) return resolved;
    return {
      id,
      name: nameFromRoute || "Người dùng",
      avatarUrl: avatarFromRoute,
      isOnline: false,
      username: undefined as string | undefined,
      phone: undefined as string | undefined,
      subtitle: undefined as string | undefined,
    };
  }, [resolved, id, nameFromRoute, avatarFromRoute]);

  const user = USE_API_MOCK
    ? mockUser
    : profileUser ?? {
        id,
        name: nameFromRoute || "Người dùng",
        avatarUrl: avatarFromRoute,
        username: undefined,
        phone: undefined,
        subtitle: undefined,
      };

  const relationMock = USE_API_MOCK ? getFriendRelation(id) : "none";
  const showPendingMock = relationMock === "pending_out" || localAddedPending;

  const isSelf = !USE_API_MOCK && viewerId && id === viewerId;

  const openChat = useCallback(async () => {
    if (USE_API_MOCK) {
      router.push({
        pathname: "/main/chat/[id]",
        params: {
          id: user.id,
          title: encodeURIComponent(user.name),
          peerAvatar: encodeURIComponent(user.avatarUrl ?? ""),
          peerId: user.id,
        },
      });
      return;
    }
    setActionBusy(true);
    try {
      const { conversation } = await createOrGetDirectConversationApi(user.id);
      const title =
        conversation.otherParticipant?.displayName?.trim() || user.name;
      const av =
        conversation.otherParticipant?.avatarUrl ?? user.avatarUrl ?? "";
      router.push({
        pathname: "/main/chat/[id]",
        params: {
          id: conversation.id,
          title: encodeURIComponent(title),
          peerAvatar: encodeURIComponent(av),
          peerId: user.id,
        },
      });
    } catch (e) {
      Alert.alert("Nhắn tin", getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }, [router, user.avatarUrl, user.id, user.name]);

  const onAddFriend = useCallback(async () => {
    if (USE_API_MOCK) {
      setLocalAddedPending(true);
      Alert.alert("Đã gửi", "Lời mời kết bạn đã được gửi (mock).");
      return;
    }
    setActionBusy(true);
    try {
      await sendFriendRequestApi(user.id);
      setRelationship("outgoing_request");
      setLocalAddedPending(false);
      void refreshFriends();
      Alert.alert("Đã gửi", "Lời mời kết bạn đã được gửi.");
    } catch (e) {
      Alert.alert("Kết bạn", getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }, [refreshFriends, user.id]);

  const onAcceptIncoming = useCallback(async () => {
    if (!incomingRequestId) {
      Alert.alert("Thiếu dữ liệu", "Không tìm thấy lời mời. Thử làm mới danh sách lời mời.");
      return;
    }
    setActionBusy(true);
    try {
      await acceptFriendRequestApi(incomingRequestId);
      setRelationship("friend");
      setIncomingRequestId(null);
      void refreshFriends();
      void fetchConversations();
      Alert.alert("Đã kết bạn", "Bạn đã chấp nhận lời mời.");
    } catch (e) {
      Alert.alert("Lỗi", getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }, [fetchConversations, incomingRequestId, refreshFriends]);

  const onRejectIncoming = useCallback(async () => {
    if (!incomingRequestId) return;
    setActionBusy(true);
    try {
      await rejectFriendRequestApi(incomingRequestId);
      setRelationship("none");
      setIncomingRequestId(null);
      void refreshFriends();
    } catch (e) {
      Alert.alert("Lỗi", getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }, [incomingRequestId, refreshFriends]);

  const onCancelOutgoing = useCallback(async () => {
    if (!outgoingRequestId) return;
    setActionBusy(true);
    try {
      await cancelFriendRequestApi(outgoingRequestId);
      setRelationship("none");
      setOutgoingRequestId(null);
      void refreshFriends();
    } catch (e) {
      Alert.alert("Lỗi", getApiErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }, [outgoingRequestId, refreshFriends]);

  const onUnfriend = useCallback(() => {
    Alert.alert("Huỷ kết bạn", `Ngừng kết bạn với ${user.name}?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xác nhận",
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (USE_API_MOCK) {
              Alert.alert("Mock", "Đã huỷ kết bạn (mock).");
              router.back();
              return;
            }
            setActionBusy(true);
            try {
              await unfriendUserApi(user.id);
              setRelationship("none");
              void refreshFriends();
              void fetchConversations();
              Alert.alert("Đã cập nhật", "Đã huỷ kết bạn.");
            } catch (e) {
              Alert.alert("Lỗi", getApiErrorMessage(e));
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  }, [fetchConversations, refreshFriends, router, user.id, user.name]);

  const onBlock = useCallback(() => {
    Alert.alert("Chặn", `Chặn ${user.name}? Họ sẽ bị xoá khỏi danh sách bạn bè.`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Chặn",
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (USE_API_MOCK) {
              setBlockedMock(true);
              Alert.alert("Đã chặn", "Người này sẽ không nhắn tin cho bạn (mock).", [
                { text: "OK", onPress: () => router.back() },
              ]);
              return;
            }
            setActionBusy(true);
            try {
              await blockUserApi(user.id);
              void refreshFriends();
              void fetchConversations();
              Alert.alert("Đã chặn", "Bạn đã chặn người này.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e) {
              Alert.alert("Lỗi", getApiErrorMessage(e));
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  }, [fetchConversations, refreshFriends, router, user.id, user.name]);

  const onUnblock = useCallback(() => {
    Alert.alert("Bỏ chặn", `Cho phép ${user.name} hiển thị lại trong tìm kiếm và tương tác?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Bỏ chặn",
        onPress: () => {
          void (async () => {
            setActionBusy(true);
            try {
              await unblockUserApi(user.id);
              void refreshFriends();
              Alert.alert("Đã bỏ chặn", "Bạn có thể tìm và xem hồ sơ người này lại.");
              router.replace({
                pathname: "/main/friends/user/[id]",
                params: {
                  id,
                  name: encodeURIComponent(user.name),
                  avatarUrl: encodeURIComponent(user.avatarUrl ?? ""),
                },
              });
              setRelationship("none");
              setApiError(null);
              setApiLoading(true);
              try {
                const data = await getUserPublicProfileApi(id);
                const p = data.profile;
                setRelationship(data.relationshipStatus);
                setProfileUser({
                  id: p.id,
                  name: p.displayName?.trim() || "Người dùng",
                  avatarUrl: p.avatarUrl ?? "",
                  username: p.username ?? undefined,
                  subtitle: p.statusMessage ?? undefined,
                });
              } catch (e) {
                setApiError(getApiErrorMessage(e));
              } finally {
                setApiLoading(false);
              }
            } catch (e) {
              Alert.alert("Lỗi", getApiErrorMessage(e));
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  }, [id, refreshFriends, router, user.avatarUrl, user.id, user.name]);

  const onReport = useCallback(() => {
    Alert.alert("Báo cáo", "Luồng báo cáo sẽ kết nối API sau.");
  }, []);

  const blockedMockUi = USE_API_MOCK && blockedMock;
  const blockedByMeLive = !USE_API_MOCK && relationship === "blocked_by_me";
  const blockedMeLive = !USE_API_MOCK && (relationship === "blocked_me" || preBlockedMe);
  const isFriendLive = !USE_API_MOCK && relationship === "friend";
  const isNoneLive = !USE_API_MOCK && relationship === "none";
  const incomingLive = !USE_API_MOCK && relationship === "incoming_request";
  const outgoingLive = !USE_API_MOCK && relationship === "outgoing_request";

  const showOutgoingPending = outgoingLive || localAddedPending;

  const title =
    blockedMockUi || blockedByMeLive ? "Đã chặn" : blockedMeLive ? "Không khả dụng" : user.name;
  const meta = USE_API_MOCK ? metaLine(mockUser) : metaLine(user);

  const renderMockBody = () => (
    <>
      {!blockedMockUi ? (
        <View style={[styles.actions, relationMock === "friend" && styles.actionsSingle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhắn tin"
            onPress={openChat}
            style={({ pressed }) => [
              styles.btnPrimary,
              relationMock === "friend" && styles.btnPrimaryFull,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.textInverse} />
            <AppText variant="caption" color="textInverse" style={styles.btnPrimaryText}>
              Nhắn tin
            </AppText>
          </Pressable>

          {relationMock === "friend" ? null : showPendingMock ? (
            <View style={styles.pendingPill}>
              <Ionicons name="time-outline" size={14} color={colors.warning} />
              <AppText variant="micro" color="textSecondary" style={{ marginLeft: 4 }}>
                Đang chờ
              </AppText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kết bạn"
              onPress={onAddFriend}
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.92 }]}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <AppText variant="caption" color="primary" style={styles.btnSecondaryText}>
                Kết bạn
              </AppText>
            </Pressable>
          )}
        </View>
      ) : null}

      {!blockedMockUi ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chặn hoặc báo cáo"
          onPress={() => setSheetOpen(true)}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
          <AppText variant="caption" color="textMuted" style={styles.linkText}>
            Chặn · báo cáo
          </AppText>
        </Pressable>
      ) : null}
    </>
  );

  const renderLiveBody = () => {
    if (isSelf) {
      return (
        <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
          Đây là hồ sơ của bạn. Chỉnh sửa tại tab Cá nhân.
        </AppText>
      );
    }
    if (apiLoading) {
      return (
        <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (apiError && !profileUser && !preBlockedByMe) {
      return (
        <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
          {apiError}
        </AppText>
      );
    }
    if (blockedMeLive) {
      return (
        <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
          Bạn không thể xem hồ sơ hoặc tương tác với người này.
        </AppText>
      );
    }
    if (blockedByMeLive || preBlockedByMe) {
      return (
        <Pressable
          accessibilityRole="button"
          onPress={onUnblock}
          disabled={actionBusy}
          style={({ pressed }) => [
            styles.btnSecondary,
            { marginTop: spacing.sm, opacity: actionBusy ? 0.6 : pressed ? 0.92 : 1 },
          ]}
        >
          <AppText variant="caption" color="primary" style={styles.btnSecondaryText}>
            Bỏ chặn
          </AppText>
        </Pressable>
      );
    }

    return (
      <>
        <View style={[styles.actions, isFriendLive && styles.actionsSingle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhắn tin"
            onPress={() => void openChat()}
            disabled={!isFriendLive || actionBusy}
            style={({ pressed }) => [
              styles.btnPrimary,
              isFriendLive && styles.btnPrimaryFull,
              pressed && { opacity: 0.92 },
              (!isFriendLive || actionBusy) && { opacity: 0.45 },
            ]}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.textInverse} />
            <AppText variant="caption" color="textInverse" style={styles.btnPrimaryText}>
              Nhắn tin
            </AppText>
          </Pressable>

          {isFriendLive ? null : incomingLive ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Pressable
                onPress={() => void onRejectIncoming()}
                disabled={actionBusy || !incomingRequestId}
                style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.9 }]}
              >
                <AppText variant="caption" color="primary" style={styles.btnSecondaryText}>
                  Từ chối
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => void onAcceptIncoming()}
                disabled={actionBusy || !incomingRequestId}
                style={({ pressed }) => [styles.btnPrimary, { paddingHorizontal: 12 }, pressed && { opacity: 0.9 }]}
              >
                <AppText variant="caption" color="textInverse" style={styles.btnPrimaryText}>
                  Đồng ý
                </AppText>
              </Pressable>
            </View>
          ) : showOutgoingPending ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.pendingPill}>
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <AppText variant="micro" color="textSecondary" style={{ marginLeft: 4 }}>
                  Đang chờ
                </AppText>
              </View>
              {outgoingLive && outgoingRequestId ? (
                <Pressable onPress={() => void onCancelOutgoing()} disabled={actionBusy}>
                  <AppText variant="micro" color="primary" style={{ fontWeight: "600" }}>
                    Thu hồi
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : isNoneLive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kết bạn"
              onPress={() => void onAddFriend()}
              disabled={actionBusy}
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.92 }]}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <AppText variant="caption" color="primary" style={styles.btnSecondaryText}>
                Kết bạn
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {!isSelf && !blockedMeLive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chặn hoặc báo cáo"
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
            <AppText variant="caption" color="textMuted" style={styles.linkText}>
              Chặn · báo cáo
            </AppText>
          </Pressable>
        ) : null}
      </>
    );
  };

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title={title}
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
        right={
          blockedMockUi ||
          blockedMeLive ||
          isSelf ||
          (!USE_API_MOCK && (blockedByMeLive || preBlockedByMe || preBlockedMe)) ? null : (
            <Pressable
              accessibilityLabel="Thêm"
              hitSlop={8}
              onPress={() => setSheetOpen(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
            </Pressable>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={160} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <AppText variant="subhead" color="textInverse" style={{ fontWeight: "700" }}>
                  {user.name.slice(0, 2).toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={styles.headerText}>
              <AppText variant="headline" numberOfLines={2} style={styles.name}>
                {user.name}
              </AppText>
              {meta.length > 0 ? (
                <AppText variant="caption" color="textMuted" numberOfLines={2} style={styles.meta}>
                  {meta}
                </AppText>
              ) : null}
              {user.subtitle ? (
                <AppText variant="micro" color="textPlaceholder" numberOfLines={1} style={styles.status}>
                  {user.subtitle}
                </AppText>
              ) : null}
            </View>
          </View>

          {USE_API_MOCK ? renderMockBody() : renderLiveBody()}
        </View>

        {!blockedMockUi && !blockedByMeLive && !preBlockedByMe && !blockedMeLive ? (
          <ProfileSharedMediaPlaceholder />
        ) : null}
      </ScrollView>

      <BlockReportSheet
        visible={sheetOpen}
        userName={user.name}
        onClose={() => setSheetOpen(false)}
        onReport={onReport}
        blockedByMe={!USE_API_MOCK && (blockedByMeLive || preBlockedByMe)}
        onUnblock={() => void onUnblock()}
        onBlock={blockedMockUi || blockedMeLive || isSelf || blockedByMeLive || preBlockedByMe ? undefined : onBlock}
        showUnfriend={!USE_API_MOCK && isFriendLive}
        onUnfriend={onUnfriend}
      />
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.chatBubbleIncomingBorder,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    justifyContent: "center",
    paddingTop: 2,
  },
  name: {
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    marginTop: 2,
  },
  status: {
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  actionsSingle: {
    alignSelf: "stretch",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  btnPrimaryText: {
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 16,
  },
  btnPrimaryFull: {
    flexGrow: 1,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  btnSecondaryText: {
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 16,
  },
  pendingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  linkText: {
    fontWeight: "500",
  },
});
