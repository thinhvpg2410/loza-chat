import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { colors, radius, spacing } from "@theme";

const MENU_ROWS = [
  { key: "wallet", icon: "wallet-outline" as const, label: "Ví & thanh toán" },
  { key: "cloud", icon: "cloud-outline" as const, label: "Cloud & sao lưu" },
  { key: "security", icon: "shield-checkmark-outline" as const, label: "Bảo mật" },
  { key: "settings", icon: "settings-outline" as const, label: "Cài đặt" },
] as const;

export default function ProfileTabScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = async () => {
    await logout();
    router.replace("/phone-login");
  };

  return (
    <AppTabScreen>
      <ShellHeader title="Cá nhân" />
      <ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
          <AppAvatar uri={user?.avatarUri} name={user?.name ?? " "} size="lg" />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <AppText variant="headline" style={{ fontWeight: "600", color: colors.text }}>
              {user?.name ?? "Người dùng"}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {user?.phone ?? ""}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs }} />

        {MENU_ROWS.map((row) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            onPress={() => {}}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.sm,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={row.icon} size={20} color={colors.primary} />
            </View>
            <AppText variant="subhead" style={{ fontWeight: "500", marginLeft: spacing.md, flex: 1, color: colors.text }}>
              {row.label}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => void onLogout()}
          style={({ pressed }) => ({
            marginHorizontal: spacing.md,
            marginTop: spacing.lg,
            paddingVertical: spacing.sm,
            alignItems: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <AppText variant="subhead" color="danger" style={{ fontWeight: "600" }}>
            Đăng xuất
          </AppText>
        </Pressable>
      </ScrollView>
    </AppTabScreen>
  );
}
