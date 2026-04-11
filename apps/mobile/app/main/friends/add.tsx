import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { FriendRow } from "@components/friends";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { searchUserMock } from "@features/friends";
import { colors, radius, spacing } from "@theme";

export default function AddFriendScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  const outcome = useMemo(() => searchUserMock(debounced, pendingIds), [debounced, pendingIds]);

  const isDebouncing = query.trim() !== debounced && query.trim().length >= 2;

  const onAddFriend = useCallback(
    (userId: string) => {
      setPendingIds((prev) => new Set(prev).add(userId));
    },
    [setPendingIds],
  );

  const openProfile = useCallback(
    (id: string, name: string, avatarUrl: string) => {
      router.push({
        pathname: "/main/friends/user/[id]",
        params: { id, name: encodeURIComponent(name), avatarUrl: encodeURIComponent(avatarUrl) },
      });
    },
    [router],
  );

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Thêm bạn"
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

      <View style={styles.searchWrap}>
        <View style={styles.searchField}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Số điện thoại hoặc tên người dùng"
            placeholderTextColor={colors.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Xóa" hitSlop={8} onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <AppText variant="micro" color="textPlaceholder" style={styles.hint}>
          Thử: vantai · 84901234567 · pendingdemo · notfound
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {debounced.length < 2 ? (
          <AppText variant="caption" color="textPlaceholder" style={styles.centerHint}>
            Nhập ít nhất 2 ký tự để tìm.
          </AppText>
        ) : null}

        {isDebouncing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {!isDebouncing && debounced.length >= 2 && outcome.state === "not_found" ? (
          <View style={styles.stateBox}>
            <Ionicons name="person-outline" size={40} color={colors.textMuted} />
            <AppText variant="subhead" color="textSecondary" style={{ marginTop: spacing.sm }}>
              Không tìm thấy người dùng
            </AppText>
          </View>
        ) : null}

        {!isDebouncing && debounced.length >= 2 && outcome.state === "found" ? (
          <View>
            <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
              Kết quả
            </AppText>
            <FriendRow
              user={outcome.user}
              onPress={() => openProfile(outcome.user.id, outcome.user.name, outcome.user.avatarUrl)}
            />
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
              onPress={() => onAddFriend(outcome.user.id)}
            >
              <AppText variant="subhead" color="textInverse" style={{ fontWeight: "600" }}>
                Kết bạn
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {!isDebouncing && debounced.length >= 2 && outcome.state === "already_friend" ? (
          <View>
            <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
              Kết quả
            </AppText>
            <FriendRow
              user={outcome.user}
              onPress={() => openProfile(outcome.user.id, outcome.user.name, outcome.user.avatarUrl)}
            />
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                Đã là bạn bè
              </AppText>
            </View>
          </View>
        ) : null}

        {!isDebouncing && debounced.length >= 2 && outcome.state === "pending" ? (
          <View>
            <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
              Kết quả
            </AppText>
            <FriendRow
              user={outcome.user}
              onPress={() => openProfile(outcome.user.id, outcome.user.name, outcome.user.avatarUrl)}
            />
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                Đang chờ xác nhận
              </AppText>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chatBubbleIncomingBorder,
    backgroundColor: colors.background,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    minHeight: 34,
  },
  input: {
    flex: 1,
    marginLeft: spacing.xs,
    paddingVertical: spacing.xs,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  hint: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  centerHint: {
    textAlign: "center",
    marginTop: spacing.lg,
  },
  loadingRow: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  addBtn: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
});
