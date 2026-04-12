import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import type { MockFriend } from "@/constants/mockData";
import { AppText } from "@ui/AppText";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

/** Dense list — aligned with compact chat rows */
const AVATAR = 36;

type FriendRowProps = {
  user: MockFriend;
  onPress: () => void;
  /** Opens direct chat; shows trailing icon without duplicating row navigation. */
  onMessagePress?: () => void;
};

export function FriendRow({ user, onPress, onMessagePress }: FriendRowProps) {
  const main = (
    <>
      <View style={styles.avatarWrap}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <AppText variant="micro" color="textSecondary" style={{ fontWeight: "700" }}>
              {user.name.slice(0, 2).toUpperCase()}
            </AppText>
          </View>
        )}
        {user.isOnline ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.body}>
        <AppText variant="headline" numberOfLines={1} style={styles.name}>
          {user.name}
        </AppText>
        <AppText variant="caption" color="textPlaceholder" numberOfLines={1} style={styles.sub}>
          {user.subtitle ?? (user.isOnline ? "Đang hoạt động" : "Offline")}
        </AppText>
      </View>
    </>
  );

  if (!onMessagePress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={user.name}
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        style={({ pressed }) => [
          styles.row,
          styles.rowPad,
          hairlineBottomBorder,
          {
            backgroundColor:
              Platform.OS === "ios" ? (pressed ? "rgba(0,0,0,0.03)" : colors.background) : colors.background,
          },
        ]}
      >
        {main}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, styles.rowSplit, hairlineBottomBorder, { backgroundColor: colors.background }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={user.name}
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        style={({ pressed }) => [
          styles.rowMain,
          Platform.OS === "ios" && pressed ? { backgroundColor: "rgba(0,0,0,0.03)" } : null,
        ]}
      >
        {main}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Nhắn tin ${user.name}`}
        hitSlop={10}
        onPress={onMessagePress}
        style={({ pressed }) => [styles.msgIcon, pressed && { opacity: 0.65 }]}
      >
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    minHeight: 46,
  },
  rowPad: {
    paddingHorizontal: spacing.md,
  },
  rowSplit: {
    paddingLeft: spacing.md,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  msgIcon: {
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
    width: AVATAR,
    height: AVATAR,
    marginRight: 10,
    alignSelf: "center",
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  avatarPh: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
  },
  onlineDot: {
    position: "absolute",
    right: -0.5,
    bottom: -0.5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: 1,
  },
  name: {
    fontWeight: "600",
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
  },
  sub: {
    marginTop: 0,
    fontSize: 12,
    lineHeight: 15,
  },
});
