import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { colors, spacing } from "@theme";

export default function SplashScreen() {
  const router = useRouter();
  const navigatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await useAuthStore.getState().hydrate();
      const authed = useAuthStore.getState().isAuthenticated;
      await new Promise((r) => setTimeout(r, 1100));
      if (cancelled || navigatedRef.current) return;
      navigatedRef.current = true;
      if (authed) {
        router.replace("/main");
      } else {
        router.replace("/phone-login");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.md,
      }}
    >
      <Image
        source={require("../assets/images/loza-logo.png")}
        style={{ width: 112, height: 112, marginBottom: spacing.md }}
        contentFit="contain"
        accessibilityLabel="Loza Chat"
      />
      <AppText variant="headline" style={{ fontWeight: "700", color: colors.text, letterSpacing: -0.3 }}>
        Loza Chat
      </AppText>
      <AppText variant="micro" color="textMuted" style={{ marginTop: 6, letterSpacing: 0.2 }}>
        Nhắn tin gọn, ổn định
      </AppText>
      <View style={{ marginTop: spacing.xxl }}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    </View>
  );
}
