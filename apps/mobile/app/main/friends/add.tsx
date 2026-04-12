import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { FriendRow } from "@components/friends";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { mapSearchResultToMockFriend, parseUserSearchInput, searchUserMock } from "@features/friends";
import { getApiErrorMessage } from "@/services/api/api";
import { sendFriendRequestApi } from "@/services/friends/friendsApi";
import { searchUsersApi, type UserSearchResultDto } from "@/services/users/usersPublicApi";
import { useAuthStore } from "@/store/authStore";
import { useFriendsStore } from "@/store/friendsStore";
import { colors, radius, spacing } from "@theme";

function openProfileFromSearch(
  router: ReturnType<typeof useRouter>,
  row: UserSearchResultDto,
) {
  router.push({
    pathname: "/main/friends/user/[id]",
    params: {
      id: row.id,
      name: encodeURIComponent(row.displayName),
      avatarUrl: encodeURIComponent(row.avatarUrl ?? ""),
      ...(row.relationshipStatus === "blocked_by_me" ? { preBlockedByMe: "1" } : {}),
      ...(row.relationshipStatus === "blocked_me" ? { preBlockedMe: "1" } : {}),
    },
  });
}

export default function AddFriendScreen() {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.user?.id ?? "");
  const refreshFriends = useFriendsStore((s) => s.refresh);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<UserSearchResultDto | null>(null);
  const [sendBusy, setSendBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  const searchParams = useMemo(() => parseUserSearchInput(debounced), [debounced]);

  useEffect(() => {
    if (USE_API_MOCK) return;
    if (debounced.length < 2) {
      setApiResult(null);
      setApiError(null);
      return;
    }
    if (!searchParams) {
      setApiResult(null);
      setApiError(null);
      return;
    }

    let cancelled = false;
    setApiLoading(true);
    setApiError(null);
    setApiResult(null);
    (async () => {
      try {
        const results = await searchUsersApi(searchParams);
        if (cancelled) return;
        setApiResult(results[0] ?? null);
      } catch (e) {
        if (!cancelled) setApiError(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, searchParams]);

  const outcomeMock = useMemo(() => searchUserMock(debounced, pendingIds), [debounced, pendingIds]);

  const isDebouncing = query.trim() !== debounced && query.trim().length >= 2;

  const onAddFriendMock = useCallback((userId: string) => {
    setPendingIds((prev) => new Set(prev).add(userId));
  }, []);

  const onAddFriendApi = useCallback(
    async (receiverId: string) => {
      setSendBusy(true);
      try {
        await sendFriendRequestApi(receiverId);
        await refreshFriends();
        Alert.alert("Đã gửi", "Lời mời kết bạn đã được gửi.");
        const results = searchParams ? await searchUsersApi(searchParams) : [];
        setApiResult(results[0] ?? null);
      } catch (e) {
        Alert.alert("Kết bạn", getApiErrorMessage(e));
      } finally {
        setSendBusy(false);
      }
    },
    [refreshFriends, searchParams],
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

  const renderApiBody = () => {
    if (debounced.length < 2) {
      return (
        <AppText variant="caption" color="textPlaceholder" style={styles.centerHint}>
          Nhập ít nhất 2 ký tự để tìm.
        </AppText>
      );
    }
    if (!searchParams) {
      return (
        <View style={styles.stateBox}>
          <AppText variant="caption" color="textSecondary" style={{ textAlign: "center", paddingHorizontal: spacing.md }}>
            Dùng đúng định dạng: username (chữ thường, số, _), email, hoặc số điện thoại (+84…).
          </AppText>
        </View>
      );
    }
    if (isDebouncing || apiLoading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (apiError) {
      return (
        <View style={styles.stateBox}>
          <AppText variant="subhead" color="textSecondary" style={{ textAlign: "center" }}>
            {apiError}
          </AppText>
          <Pressable
            onPress={() => {
              if (!searchParams) return;
              setApiLoading(true);
              setApiError(null);
              void searchUsersApi(searchParams)
                .then((r) => setApiResult(r[0] ?? null))
                .catch((e) => setApiError(getApiErrorMessage(e)))
                .finally(() => setApiLoading(false));
            }}
            style={({ pressed }) => ({
              marginTop: spacing.sm,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <AppText variant="caption" color="textInverse" style={{ fontWeight: "600" }}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      );
    }
    if (!apiResult) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="person-outline" size={40} color={colors.textMuted} />
          <AppText variant="subhead" color="textSecondary" style={{ marginTop: spacing.sm }}>
            Không tìm thấy người dùng
          </AppText>
        </View>
      );
    }

    if (apiResult.id === viewerId) {
      return (
        <AppText variant="caption" color="textPlaceholder" style={styles.centerHint}>
          Đây là tài khoản của bạn.
        </AppText>
      );
    }

    const user = mapSearchResultToMockFriend(apiResult);
    const rs = apiResult.relationshipStatus;

    if (rs === "blocked_me") {
      return (
        <View>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            Kết quả
          </AppText>
          <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
          <View style={styles.badge}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
              Không thể kết bạn hoặc nhắn tin
            </AppText>
          </View>
        </View>
      );
    }

    if (rs === "blocked_by_me") {
      return (
        <View>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            Kết quả
          </AppText>
          <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
          <AppText variant="micro" color="textPlaceholder" style={{ marginTop: spacing.xs }}>
            Bạn đã chặn người này. Mở hồ sơ để bỏ chặn.
          </AppText>
        </View>
      );
    }

    if (rs === "friend") {
      return (
        <View>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            Kết quả
          </AppText>
          <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
              Đã là bạn bè
            </AppText>
          </View>
        </View>
      );
    }

    if (rs === "outgoing_request") {
      return (
        <View>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            Kết quả
          </AppText>
          <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
              Đang chờ xác nhận
            </AppText>
          </View>
        </View>
      );
    }

    if (rs === "incoming_request") {
      return (
        <View>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            Kết quả
          </AppText>
          <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
          <View style={styles.badge}>
            <Ionicons name="mail-unread-outline" size={16} color={colors.primary} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
              Người này đã gửi lời mời — xem tại Lời mời
            </AppText>
          </View>
        </View>
      );
    }

    return (
      <View>
        <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
          Kết quả
        </AppText>
        <FriendRow user={user} onPress={() => openProfileFromSearch(router, apiResult)} />
        <Pressable
          style={({ pressed }) => [styles.addBtn, (pressed || sendBusy) && { opacity: 0.9 }]}
          disabled={sendBusy}
          onPress={() => void onAddFriendApi(apiResult.id)}
        >
          <AppText variant="subhead" color="textInverse" style={{ fontWeight: "600" }}>
            {sendBusy ? "Đang gửi…" : "Kết bạn"}
          </AppText>
        </Pressable>
      </View>
    );
  };

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
            placeholder="Username, email hoặc số điện thoại (+84…)"
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
          {USE_API_MOCK
            ? "Thử: vantai · 84901234567 · pendingdemo · notfound"
            : "Tìm chính xác theo username, email hoặc SĐT (E.164, ví dụ +84901234567)."}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {USE_API_MOCK ? (
          <>
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

            {!isDebouncing && debounced.length >= 2 && outcomeMock.state === "not_found" ? (
              <View style={styles.stateBox}>
                <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                <AppText variant="subhead" color="textSecondary" style={{ marginTop: spacing.sm }}>
                  Không tìm thấy người dùng
                </AppText>
              </View>
            ) : null}

            {!isDebouncing && debounced.length >= 2 && outcomeMock.state === "found" ? (
              <View>
                <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
                  Kết quả
                </AppText>
                <FriendRow
                  user={outcomeMock.user}
                  onPress={() =>
                    openProfile(outcomeMock.user.id, outcomeMock.user.name, outcomeMock.user.avatarUrl)
                  }
                />
                <Pressable
                  style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
                  onPress={() => onAddFriendMock(outcomeMock.user.id)}
                >
                  <AppText variant="subhead" color="textInverse" style={{ fontWeight: "600" }}>
                    Kết bạn
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {!isDebouncing && debounced.length >= 2 && outcomeMock.state === "already_friend" ? (
              <View>
                <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
                  Kết quả
                </AppText>
                <FriendRow
                  user={outcomeMock.user}
                  onPress={() =>
                    openProfile(outcomeMock.user.id, outcomeMock.user.name, outcomeMock.user.avatarUrl)
                  }
                />
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                    Đã là bạn bè
                  </AppText>
                </View>
              </View>
            ) : null}

            {!isDebouncing && debounced.length >= 2 && outcomeMock.state === "pending" ? (
              <View>
                <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
                  Kết quả
                </AppText>
                <FriendRow
                  user={outcomeMock.user}
                  onPress={() =>
                    openProfile(outcomeMock.user.id, outcomeMock.user.name, outcomeMock.user.avatarUrl)
                  }
                />
                <View style={styles.badge}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                  <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                    Đang chờ xác nhận
                  </AppText>
                </View>
              </View>
            ) : null}
          </>
        ) : (
          renderApiBody()
        )}
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
