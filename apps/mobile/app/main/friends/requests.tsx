import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";

import { FriendRequestRow } from "@components/friends";
import { AppTabScreen, AppSectionHeader, EmptyState, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import {
  MOCK_INCOMING_FRIEND_REQUESTS,
  MOCK_OUTGOING_FRIEND_REQUESTS,
  type MockFriendRequest,
  type MockOutgoingFriendRequest,
} from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import {
  acceptFriendRequestApi,
  cancelFriendRequestApi,
  rejectFriendRequestApi,
} from "@/services/friends/friendsApi";
import { getApiErrorMessage } from "@/services/api/api";
import { useFriendsStore } from "@/store/friendsStore";
import { colors, spacing } from "@theme";

function openProfileParams(peer: { id: string; name: string; avatarUrl: string }) {
  return {
    pathname: "/main/friends/user/[id]" as const,
    params: {
      id: peer.id,
      name: encodeURIComponent(peer.name),
      avatarUrl: encodeURIComponent(peer.avatarUrl),
    },
  };
}

export default function FriendRequestsScreen() {
  const router = useRouter();
  const [incomingMock, setIncomingMock] = useState<MockFriendRequest[]>(() => [...MOCK_INCOMING_FRIEND_REQUESTS]);
  const [outgoingMock, setOutgoingMock] = useState<MockOutgoingFriendRequest[]>(() => [...MOCK_OUTGOING_FRIEND_REQUESTS]);
  const [refreshing, setRefreshing] = useState(false);

  const apiIncoming = useFriendsStore((s) => s.incoming);
  const apiOutgoing = useFriendsStore((s) => s.outgoing);
  const apiError = useFriendsStore((s) => s.error);
  const apiLoading = useFriendsStore((s) => s.loading);
  const apiLoaded = useFriendsStore((s) => s.hasLoadedOnce);
  const refreshFriends = useFriendsStore((s) => s.refresh);

  useEffect(() => {
    if (!USE_API_MOCK) {
      void refreshFriends();
    }
  }, [refreshFriends]);

  const incoming = USE_API_MOCK
    ? incomingMock.map((r) => ({ requestId: r.id, peer: r.peer, message: null as string | null }))
    : apiIncoming;
  const outgoing = USE_API_MOCK
    ? outgoingMock.map((r) => ({ requestId: r.id, peer: r.peer, message: null as string | null }))
    : apiOutgoing;

  const incomingCount = incoming.length;
  const outgoingCount = outgoing.length;

  const title = useMemo(
    () => (incomingCount || outgoingCount ? `Lời mời (${incomingCount + outgoingCount})` : "Lời mời"),
    [incomingCount, outgoingCount],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (USE_API_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await refreshFriends();
    }
    setRefreshing(false);
  }, [refreshFriends]);

  const onAccept = useCallback(
    async (requestId: string) => {
      if (USE_API_MOCK) {
        setIncomingMock((prev) => prev.filter((r) => r.id !== requestId));
        return;
      }
      try {
        await acceptFriendRequestApi(requestId);
        await refreshFriends();
        Alert.alert("Đã kết bạn", "Lời mời đã được chấp nhận.");
      } catch (e) {
        Alert.alert("Lỗi", getApiErrorMessage(e));
      }
    },
    [refreshFriends],
  );

  const onReject = useCallback(
    async (requestId: string) => {
      if (USE_API_MOCK) {
        setIncomingMock((prev) => prev.filter((r) => r.id !== requestId));
        return;
      }
      try {
        await rejectFriendRequestApi(requestId);
        await refreshFriends();
      } catch (e) {
        Alert.alert("Lỗi", getApiErrorMessage(e));
      }
    },
    [refreshFriends],
  );

  const onCancel = useCallback(
    async (requestId: string) => {
      if (USE_API_MOCK) {
        setOutgoingMock((prev) => prev.filter((r) => r.id !== requestId));
        return;
      }
      try {
        await cancelFriendRequestApi(requestId);
        await refreshFriends();
      } catch (e) {
        Alert.alert("Lỗi", getApiErrorMessage(e));
      }
    },
    [refreshFriends],
  );

  const goProfile = useCallback(
    (peer: MockFriendRequest["peer"] | MockOutgoingFriendRequest["peer"]) => {
      router.push(openProfileParams(peer));
    },
    [router],
  );

  const showError = !USE_API_MOCK && apiError && !apiLoading && apiLoaded;

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title={title}
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

      {showError ? (
        <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
          <EmptyState icon="cloud-offline-outline" title="Không tải được lời mời" description={apiError} />
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
      ) : !USE_API_MOCK && apiLoading && !apiLoaded ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {incoming.length ? (
            <View>
              <AppSectionHeader title="Đến" compact />
              {incoming.map((r) => (
                <FriendRequestRow
                  key={r.requestId}
                  user={r.peer}
                  direction="incoming"
                  onAccept={() => void onAccept(r.requestId)}
                  onReject={() => void onReject(r.requestId)}
                  onOpenProfile={() => goProfile(r.peer)}
                />
              ))}
            </View>
          ) : null}

          {outgoing.length ? (
            <View>
              <AppSectionHeader title="Đã gửi" compact />
              {outgoing.map((r) => (
                <FriendRequestRow
                  key={r.requestId}
                  user={r.peer}
                  direction="outgoing"
                  onCancel={() => void onCancel(r.requestId)}
                  onOpenProfile={() => goProfile(r.peer)}
                />
              ))}
            </View>
          ) : null}

          {!incoming.length && !outgoing.length ? (
            <EmptyState icon="mail-open-outline" title="Không có lời mời" description="Lời mời kết bạn sẽ hiển thị tại đây." />
          ) : null}
        </ScrollView>
      )}
    </AppTabScreen>
  );
}
