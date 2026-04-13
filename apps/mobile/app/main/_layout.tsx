import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, View } from "react-native";

import { USE_API_MOCK } from "@/constants/env";
import { connectChatSocket, isChatSocketConfigured } from "@/services/socket/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { colors } from "@theme";

export default function MainLayout() {
  const [ready, setReady] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useAuthStore.getState().hydrate();
      if (!cancelled && useAuthStore.getState().isAuthenticated) {
        void useAuthStore.getState().syncProfileFromServer();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== "active") return;
      if (!ready) return;
      if (!useAuthStore.getState().isAuthenticated) return;
      void useAuthStore.getState().syncProfileFromServer();
      if (!USE_API_MOCK) {
        void useChatStore.getState().fetchConversations({ silent: true });
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [ready]);

  useEffect(() => {
    if (!ready || !isAuthenticated || USE_API_MOCK || !isChatSocketConfigured() || !accessToken) {
      return () => {};
    }
    return connectChatSocket(accessToken);
  }, [ready, isAuthenticated, accessToken]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/phone-login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
}
