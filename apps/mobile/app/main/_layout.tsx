import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, View } from "react-native";

import { useAuthStore } from "@/store/authStore";
import { colors } from "@theme";

export default function MainLayout() {
  const [ready, setReady] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
      if (!useAuthStore.getState().isAuthenticated) return;
      void useAuthStore.getState().syncProfileFromServer();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

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
