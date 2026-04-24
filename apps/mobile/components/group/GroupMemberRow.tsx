import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import type { GroupMemberRole } from "@features/group";
import { GroupRoleBadge } from "./GroupStateBadges";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

const AVATAR = 36;

type GroupMemberRowProps = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  isSelf?: boolean;
  canManage?: boolean;
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
        <GroupRoleBadge role={role} />
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
});
