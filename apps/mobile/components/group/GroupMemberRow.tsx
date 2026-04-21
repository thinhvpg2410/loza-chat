import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import type { GroupMemberRole } from "@features/group";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

const AVATAR = 36;

function roleLabel(role: GroupMemberRole): string {
  switch (role) {
    case "owner":
      return "Trưởng nhóm";
    case "admin":
      return "Phó nhóm";
    default:
      return "Thành viên";
  }
}

type GroupMemberRowProps = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  /** Hide actions for the signed-in member row */
  isSelf?: boolean;
  /** Owner cannot be removed from UI */
  canManage?: boolean;
  /** When set, ellipsis opens this instead of the default “remove only” alert (e.g. API role actions). */
  onManageMember?: (memberId: string) => void;
  onMenuPress?: (memberId: string) => void;
};

export function GroupMemberRow({
  id,
  name,
  avatarUrl,
  role,
  isSelf = false,
  canManage = true,
  onManageMember,
  onMenuPress,
}: GroupMemberRowProps) {
  const openMenu = () => {
    if (isSelf || !canManage || role === "owner") return;
    if (onManageMember) {
      onManageMember(id);
      return;
    }
    Alert.alert(name, undefined, [
      {
        text: "Xóa khỏi nhóm",
        style: "destructive",
        onPress: () => onMenuPress?.(id),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {}}
      style={({ pressed }) => [
        styles.row,
        hairlineBottomBorder,
        {
          backgroundColor:
            Platform.OS === "ios" ? (pressed ? "rgba(0,0,0,0.03)" : colors.background) : colors.background,
        },
      ]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" transition={100} />
      ) : (
        <View style={[styles.avatar, styles.avatarPh]}>
          <Ionicons name="person" size={18} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <AppText variant="headline" numberOfLines={1} style={styles.name}>
          {name}
        </AppText>
        <View style={styles.badge}>
          <AppText variant="micro" color="textSecondary" style={styles.badgeText}>
            {roleLabel(role)}
          </AppText>
        </View>
      </View>
      {!isSelf && canManage && role !== "owner" ? (
        <Pressable accessibilityLabel="Thêm tùy chọn" hitSlop={8} onPress={openMenu} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    minHeight: 48,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: 10,
  },
  avatarPh: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  name: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 19,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
});
