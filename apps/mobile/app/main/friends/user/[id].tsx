import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BlockReportSheet, ProfileSharedMediaPlaceholder } from "@components/friends";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { findUserById, getFriendRelation } from "@features/friends";
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

function metaLine(user: {
  username?: string;
  phone?: string;
}): string {
  const parts: string[] = [];
  if (user.username) parts.push(`@${user.username}`);
  if (user.phone) parts.push(user.phone);
  return parts.join(" · ");
}

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; avatarUrl?: string }>();
  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const nameFromRoute = decodeParam(params.name);
  const avatarFromRoute = decodeParam(params.avatarUrl);

  const resolved = useMemo(() => findUserById(id), [id]);

  const user = useMemo(() => {
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

  const relation = getFriendRelation(id);
  const [blocked, setBlocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localAddedPending, setLocalAddedPending] = useState(false);

  const showPending = relation === "pending_out" || localAddedPending;

  const openChat = useCallback(() => {
    router.push({
      pathname: "/main/chat/[id]",
      params: {
        id: user.id,
        title: encodeURIComponent(user.name),
        peerAvatar: encodeURIComponent(user.avatarUrl ?? ""),
        peerId: user.id,
      },
    });
  }, [router, user.avatarUrl, user.id, user.name]);

  const onAddFriend = useCallback(() => {
    setLocalAddedPending(true);
    Alert.alert("Đã gửi", "Lời mời kết bạn đã được gửi (mock).");
  }, []);

  const onBlock = useCallback(() => {
    Alert.alert("Chặn", `Bạn có chắc muốn chặn ${user.name}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Chặn",
        style: "destructive",
        onPress: () => {
          setBlocked(true);
          Alert.alert("Đã chặn", "Người này sẽ không nhắn tin cho bạn (mock).", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
      },
    ]);
  }, [router, user.name]);

  const onReport = useCallback(() => {
    Alert.alert("Báo cáo", "Luồng báo cáo sẽ kết nối API sau.");
  }, []);

  const title = blocked ? "Đã chặn" : user.name;
  const meta = metaLine(user);

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
          <Pressable
            accessibilityLabel="Thêm"
            hitSlop={8}
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
          </Pressable>
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

          {!blocked ? (
            <View style={[styles.actions, relation === "friend" && styles.actionsSingle]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nhắn tin"
                onPress={openChat}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  relation === "friend" && styles.btnPrimaryFull,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.textInverse} />
                <AppText variant="caption" color="textInverse" style={styles.btnPrimaryText}>
                  Nhắn tin
                </AppText>
              </Pressable>

              {relation === "friend" ? null : showPending ? (
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

          {!blocked ? (
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
        </View>

        {!blocked ? <ProfileSharedMediaPlaceholder /> : null}
      </ScrollView>

      <BlockReportSheet
        visible={sheetOpen}
        userName={user.name}
        onClose={() => setSheetOpen(false)}
        onBlock={onBlock}
        onReport={onReport}
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
