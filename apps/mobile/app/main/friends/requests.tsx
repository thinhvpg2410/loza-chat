import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { FriendRequestRow } from "@components/friends";
import { AppTabScreen, AppSectionHeader, EmptyState, ShellHeader } from "@components/shell";
import {
  MOCK_INCOMING_FRIEND_REQUESTS,
  MOCK_OUTGOING_FRIEND_REQUESTS,
  type MockFriendRequest,
  type MockOutgoingFriendRequest,
} from "@/constants/mockData";
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
  const [incoming, setIncoming] = useState<MockFriendRequest[]>(() => [...MOCK_INCOMING_FRIEND_REQUESTS]);
  const [outgoing, setOutgoing] = useState<MockOutgoingFriendRequest[]>(() => [...MOCK_OUTGOING_FRIEND_REQUESTS]);

  const incomingCount = incoming.length;
  const outgoingCount = outgoing.length;

  const title = useMemo(
    () => (incomingCount || outgoingCount ? `Lời mời (${incomingCount + outgoingCount})` : "Lời mời"),
    [incomingCount, outgoingCount],
  );

  const onAccept = useCallback((id: string) => {
    setIncoming((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onReject = useCallback((id: string) => {
    setIncoming((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onCancel = useCallback((id: string) => {
    setOutgoing((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const goProfile = useCallback(
    (peer: MockFriendRequest["peer"] | MockOutgoingFriendRequest["peer"]) => {
      router.push(openProfileParams(peer));
    },
    [router],
  );

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

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
      >
        {incoming.length ? (
          <View>
            <AppSectionHeader title="Đến" compact />
            {incoming.map((r) => (
              <FriendRequestRow
                key={r.id}
                user={r.peer}
                direction="incoming"
                onAccept={() => onAccept(r.id)}
                onReject={() => onReject(r.id)}
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
                key={r.id}
                user={r.peer}
                direction="outgoing"
                onCancel={() => onCancel(r.id)}
                onOpenProfile={() => goProfile(r.peer)}
              />
            ))}
          </View>
        ) : null}

        {!incoming.length && !outgoing.length ? (
          <EmptyState icon="mail-open-outline" title="Không có lời mời" description="Lời mời kết bạn sẽ hiển thị tại đây." />
        ) : null}
      </ScrollView>
    </AppTabScreen>
  );
}
