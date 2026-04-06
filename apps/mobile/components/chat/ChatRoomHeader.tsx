import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { AppAvatar } from "@ui/AppAvatar";
import { colors, headerSeparator, spacing } from "@theme";

const HEADER_ROW = 40;

type ChatRoomHeaderProps = {
  title: string;
  status: string;
  avatarUrl?: string;
  onBack: () => void;
  onCallPress?: () => void;
  onVideoPress?: () => void;
  onMorePress?: () => void;
  /** Group chat — tap title/avatar opens group info */
  onTitlePress?: () => void;
  /** Hide call/video affordances in group threads */
  isGroup?: boolean;
};

export function ChatRoomHeader({
  title,
  status,
  avatarUrl,
  onBack,
  onCallPress,
  onVideoPress,
  onMorePress,
  onTitlePress,
  isGroup,
}: ChatRoomHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[headerSeparator, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>

        {onTitlePress ? (
          <Pressable accessibilityRole="button" onPress={onTitlePress} style={styles.center}>
            <View style={styles.titleRow}>
              <AppAvatar uri={avatarUrl} name={title} size="xs" />
              <View style={styles.titleText}>
                <AppText variant="headline" numberOfLines={1} style={styles.title}>
                  {title}
                </AppText>
                <AppText variant="micro" color="textMuted" numberOfLines={1} style={styles.status}>
                  {status}
                </AppText>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.center}>
            <View style={styles.titleRow}>
              <AppAvatar uri={avatarUrl} name={title} size="xs" />
              <View style={styles.titleText}>
                <AppText variant="headline" numberOfLines={1} style={styles.title}>
                  {title}
                </AppText>
                <AppText variant="micro" color="textMuted" numberOfLines={1} style={styles.status}>
                  {status}
                </AppText>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {!isGroup ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gọi thoại"
                hitSlop={6}
                onPress={onCallPress ?? (() => {})}
                style={({ pressed }) => [styles.iconHit, pressed && styles.pressed]}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gọi video"
                hitSlop={6}
                onPress={onVideoPress ?? (() => {})}
                style={({ pressed }) => [styles.iconHit, pressed && styles.pressed]}
              >
                <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              </Pressable>
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thêm"
            hitSlop={6}
            onPress={onMorePress ?? (() => {})}
            style={({ pressed }) => [styles.iconHit, pressed && styles.pressed]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: HEADER_ROW,
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  back: {
    width: 36,
    height: HEADER_ROW,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
  },
  status: {
    marginTop: 0,
    fontWeight: "400",
    fontSize: 11,
    lineHeight: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
    gap: 0,
  },
  iconHit: {
    width: 34,
    height: HEADER_ROW,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
