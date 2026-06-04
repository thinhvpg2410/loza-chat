import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { isoToDdMmYyyy } from "@features/profile/birthDateDdMmYyyy";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppAvatar } from "@ui/AppAvatar";
import { AppButton } from "@ui/AppButton";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { colors, radius, spacing } from "@theme";

type MenuRow = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color?: string;
};

const ACCOUNT_ROWS: MenuRow[] = [
  { key: "profile", icon: "person-outline", label: "Chỉnh sửa hồ sơ" },
  { key: "wallet", icon: "wallet-outline", label: "Ví & thanh toán" },
  { key: "cloud", icon: "cloud-outline", label: "Cloud & sao lưu" },
];

const SYSTEM_ROWS: MenuRow[] = [
  { key: "security", icon: "shield-checkmark-outline", label: "Bảo mật & thiết bị" },
  { key: "settings", icon: "settings-outline", label: "Cài đặt" },
];

export default function ProfileTabScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = async () => {
    await logout();
    router.replace("/phone-login");
  };

  const handleRow = (key: string) => {
    if (key === "profile") router.push("/main/profile-edit");
    if (key === "security" || key === "settings") router.push("/main/security");
  };

  return (
    <AppTabScreen>
      <ShellHeader title="Cá nhân" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Profile Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chỉnh sửa hồ sơ"
          onPress={() => router.push("/main/profile-edit")}
          style={({ pressed }) => [styles.profileCard, { opacity: pressed ? 0.9 : 1 }]}
        >
          <AppAvatar uri={user?.avatarUri} name={user?.name ?? " "} size="lg" />
          <View style={styles.profileInfo}>
            <AppText variant="headline" style={{ fontWeight: "700", color: colors.text, fontSize: 17 }}>
              {user?.name ?? "Người dùng"}
            </AppText>
            {user?.username ? (
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                @{user.username}
              </AppText>
            ) : null}
            <AppText variant="caption" color="textSecondary" style={{ marginTop: user?.username ? 1 : 2 }}>
              {[user?.phone, user?.birthDate ? isoToDdMmYyyy(user.birthDate) : null]
                .filter(Boolean)
                .join(" · ")}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Account Section */}
        <View style={styles.sectionLabel}>
          <AppText variant="micro" color="textMuted" style={{ fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Tài khoản
          </AppText>
        </View>
        <View style={styles.card}>
          {ACCOUNT_ROWS.map((row, idx) => (
            <View key={row.key}>
              {idx > 0 ? <View style={styles.rowDivider} /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => handleRow(row.key)}
                style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
                  <Ionicons name={row.icon} size={18} color={colors.primary} />
                </View>
                <AppText variant="subhead" style={styles.menuLabel}>
                  {row.label}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* System Section */}
        <View style={styles.sectionLabel}>
          <AppText variant="micro" color="textMuted" style={{ fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Hệ thống
          </AppText>
        </View>
        <View style={styles.card}>
          {SYSTEM_ROWS.map((row, idx) => (
            <View key={row.key}>
              {idx > 0 ? <View style={styles.rowDivider} /> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => handleRow(row.key)}
                style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
                  <Ionicons name={row.icon} size={18} color={colors.textSecondary} />
                </View>
                <AppText variant="subhead" style={styles.menuLabel}>
                  {row.label}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
          <AppButton
            title="Đăng xuất"
            variant="danger"
            onPress={() => void onLogout()}
          />
        </View>

        <AppText
          variant="micro"
          color="textPlaceholder"
          style={{ textAlign: "center", marginTop: spacing.md }}
        >
          Loza Chat · v1.0
        </AppText>
      </ScrollView>
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: "500",
    fontSize: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 58,
  },
});
