import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import type { MockFriend } from "@/constants/mockData";
import { AppText } from "@ui/AppText";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

const AVATAR = 36;

type BlockedUserRowProps = {
  user: MockFriend;
  /** Shown under name, e.g. blocked date */
  subtitle?: string | null;
  onUnblock: () => void;
  onOpenProfile?: () => void;
};

export function BlockedUserRow({ user, subtitle, onUnblock, onOpenProfile }: BlockedUserRowProps) {
  return (
    <View style={[styles.row, hairlineBottomBorder]}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenProfile}
        style={({ pressed }) => [
          styles.main,
          Platform.OS === "ios" && pressed ? { opacity: 0.92 } : null,
        ]}
      >
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
        </View>
        <View style={styles.body}>
          <AppText variant="headline" numberOfLines={1} style={styles.name}>
            {user.name}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="textPlaceholder" numberOfLines={1} style={styles.sub}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Bỏ chặn"
          onPress={onUnblock}
          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
        >
          <AppText variant="micro" color="textSecondary" style={styles.btnLabel}>
            Bỏ chặn
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
    paddingVertical: 2,
    minHeight: 48,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  avatarWrap: {
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    paddingRight: spacing.sm,
    gap: 4,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnLabel: {
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.88,
  },
});
