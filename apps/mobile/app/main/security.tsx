import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

const ROWS = [
  {
    key: "password",
    icon: "key-outline" as const,
    label: "Đổi mật khẩu",
    href: "/main/change-password" as const,
  },
  {
    key: "sessions",
    icon: "phone-portrait-outline" as const,
    label: "Thiết bị đăng nhập",
    subtitle: "Xem và thu hồi phiên",
    href: "/main/active-sessions" as const,
  },
] as const;

export default function SecurityHubScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll horizontalPadding="md" safeEdges={["top", "left", "right", "bottom"]} keyboardOffset={0}>
      <AuthHeader title="Bảo mật" subtitle="Mật khẩu và phiên đăng nhập trên các thiết bị." />

      {ROWS.map((row) => (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          onPress={() => router.push(row.href)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.md,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={styles.iconBox}>
            <Ionicons name={row.icon} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: spacing.md }}>
            <AppText variant="subhead" style={{ fontWeight: "600", color: colors.text }}>
              {row.label}
            </AppText>
            {"subtitle" in row && row.subtitle ? (
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {row.subtitle}
              </AppText>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
