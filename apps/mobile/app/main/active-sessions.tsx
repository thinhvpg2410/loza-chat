import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@components/auth";
import { SessionRow } from "@components/security";
import { AppButton } from "@ui/AppButton";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import {
  fetchActiveSessions,
  logoutAllDevicesRemote,
  revokeSessionRemote,
  type UserSession,
} from "@/services/sessions/sessionsApi";
import { useAuthStore } from "@/store/authStore";
import { colors, spacing } from "@theme";

export default function ActiveSessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);

  const reload = useCallback(async () => {
    setError(undefined);
    try {
      const list = await fetchActiveSessions();
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const list = await fetchActiveSessions();
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const finishLocalSignOut = useCallback(async () => {
    await logout();
    router.replace("/phone-login");
  }, [logout, router]);

  const performRevoke = useCallback(
    async (session: UserSession) => {
      setRevokingId(session.id);
      setError(undefined);
      try {
        await revokeSessionRemote(session.id);
        if (session.isCurrent) {
          await finishLocalSignOut();
          return;
        }
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Thao tác thất bại.");
      } finally {
        setRevokingId(null);
      }
    },
    [finishLocalSignOut, reload],
  );

  const confirmRevoke = useCallback(
    (session: UserSession) => {
      const isCurrent = session.isCurrent;
      Alert.alert(
        isCurrent ? "Đăng xuất thiết bị này?" : "Thu hồi phiên?",
        isCurrent
          ? "Phiên trên máy này sẽ kết thúc. Bạn cần đăng nhập lại để tiếp tục."
          : "Thiết bị đó sẽ bị đăng xuất. Access token có thể còn hiệu lực ngắn cho đến khi hết hạn.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: isCurrent ? "Đăng xuất" : "Thu hồi",
            style: "destructive",
            onPress: () => void performRevoke(session),
          },
        ],
      );
    },
    [performRevoke],
  );

  const performLogoutAll = useCallback(async () => {
    setLogoutAllBusy(true);
    setError(undefined);
    try {
      await logoutAllDevicesRemote();
      await finishLocalSignOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đăng xuất hết được.");
    } finally {
      setLogoutAllBusy(false);
    }
  }, [finishLocalSignOut]);

  const confirmLogoutAll = useCallback(() => {
    Alert.alert(
      "Đăng xuất tất cả thiết bị?",
      USE_API_MOCK
        ? "Mock: mọi phiên (gồm máy này) sẽ kết thúc. Bạn sẽ quay lại màn hình đăng nhập."
        : "Mọi thiết bị đang đăng nhập sẽ mất phiên, gồm cả máy này. Bạn cần đăng nhập lại.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất tất cả",
          style: "destructive",
          onPress: () => void performLogoutAll(),
        },
      ],
    );
  }, [performLogoutAll]);

  const bottomPad = Math.max(insets.bottom, spacing.md);

  const listHeader = (
    <View style={{ marginBottom: spacing.sm }}>
      <AuthHeader
        title="Thiết bị đăng nhập"
        subtitle="Thu hồi phiên lạ hoặc đăng xuất máy bạn đang dùng."
      />
      {error ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );

  const listFooter = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: bottomPad }}>
      <AppButton
        title="Đăng xuất tất cả thiết bị"
        variant="outline"
        compact
        loading={logoutAllBusy}
        disabled={logoutAllBusy || loading}
        onPress={confirmLogoutAll}
      />
    </View>
  );

  return (
    <AppScreen horizontalPadding="md" safeEdges={["top", "left", "right"]} keyboardOffset={0}>
      {loading && sessions.length === 0 ? (
        <View style={{ flex: 1, paddingTop: spacing.xl }}>
          {listHeader}
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={sessions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={
            <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
              Không có phiên đang hoạt động.
            </AppText>
          }
          renderItem={({ item }) => (
            <SessionRow
              session={item}
              onRevokePress={confirmRevoke}
              busy={revokingId === item.id || logoutAllBusy}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.sm }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AppScreen>
  );
}
