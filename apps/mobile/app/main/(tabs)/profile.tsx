import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { isoToDdMmYyyy } from "@features/profile/birthDateDdMmYyyy";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { colors, radius, spacing } from "@theme";

const MENU_ROWS = [
  { key: "profile", icon: "person-outline" as const, label: "Chỉnh sửa hồ sơ" },
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chỉnh sửa hồ sơ"
          onPress={() => router.push("/main/profile-edit")}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            alignSelf: "stretch",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <AppAvatar uri={user?.avatarUri} name={user?.name ?? " "} size="lg" />
          <View style={{ marginLeft: spacing.md, flex: 1, minWidth: 0 }}>
            <AppText variant="headline" style={{ fontWeight: "600", color: colors.text }}>
              {user?.name ?? "Người dùng"}
            </AppText>
            {user?.username ? (
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                @{user.username}
              </AppText>
            ) : null}
            <AppText variant="caption" color="textSecondary" style={{ marginTop: user?.username ? 2 : 2 }}>
              {user?.phone ?? ""}
              {user?.birthDate ? ` · ${isoToDdMmYyyy(user.birthDate)}` : ""}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ flexShrink: 0 }} />
        </Pressable>

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs }} />

        {MENU_ROWS.map((row) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            onPress={() => {
              if (row.key === "profile") {
                router.push("/main/profile-edit");
              }
              if (row.key === "security") {
                router.push("/main/change-password");
              }
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              alignSelf: "stretch",
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
                flexShrink: 0,
              }}
            >
              <Ionicons name={row.icon} size={20} color={colors.primary} />
            </View>
            <AppText
              variant="subhead"
              numberOfLines={2}
              style={{
                fontWeight: "500",
                marginLeft: spacing.md,
                flex: 1,
                minWidth: 0,
                color: colors.text,
              }}
            >
              {row.label}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ flexShrink: 0 }} />
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
