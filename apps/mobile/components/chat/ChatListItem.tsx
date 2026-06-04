import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import type { MockConversation } from "@/constants/mockData";
import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { UnreadBadge } from "./UnreadBadge";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

const AVATAR_SIZE = 46; // matches avatarSizes.md from theme

type ChatListItemProps = {
  item: MockConversation;
  onPress: () => void;
};

export function ChatListItem({ item, onPress }: ChatListItemProps) {
  const hasUnread = (item.unreadCount ?? 0) > 0;
  const previewMuted = item.isMuted && !hasUnread;
  const isGroup = item.kind === "group";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      style={({ pressed }) => [
        styles.row,
        hairlineBottomBorder,
        {
          backgroundColor:
            Platform.OS === "ios"
              ? pressed
                ? colors.surfaceSecondary
                : colors.background
              : colors.background,
        },
      ]}
    >
      {/* Avatar container — fixed 48×48, clips badge overflow */}
      <View style={styles.avatarOuter}>
        <View style={styles.avatarClip}>
          <AppAvatar uri={item.avatarUrl} name={item.name} size="md" />
        </View>
        {isGroup ? (
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={8} color={colors.textInverse} />
          </View>
        ) : null}
        {!isGroup && item.isOnline && !item.verified ? (
          <View style={styles.onlineDot} />
        ) : null}
        {!isGroup && item.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={8} color={colors.textInverse} />
          </View>
        ) : null}
      </View>

      {/* Text body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <AppText
            variant="headline"
            numberOfLines={1}
            style={[
              styles.name,
              { fontWeight: hasUnread ? "700" : "600" },
            ]}
          >
            {item.name}
          </AppText>
          <View style={styles.metaRight}>
            {item.isPinned ? (
              <Ionicons name="pin" size={11} color={colors.textMuted} />
            ) : null}
            {item.isMuted ? (
              <Ionicons name="volume-mute-outline" size={11} color={colors.textMuted} />
            ) : null}
            <AppText
              variant="micro"
              color="textPlaceholder"
              numberOfLines={1}
              style={styles.time}
            >
              {item.time}
            </AppText>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <AppText
            variant="caption"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.preview,
              {
                color: hasUnread
                  ? colors.textSecondary
                  : previewMuted
                    ? colors.textMuted
                    : colors.textPlaceholder,
                fontWeight: hasUnread ? "500" : "400",
              },
            ]}
          >
            {isGroup && item.memberCount != null
              ? `${item.memberCount} thành viên · ${item.lastMessage}`
              : item.lastMessage}
          </AppText>
          <UnreadBadge count={item.unreadCount ?? 0} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 68,
  },
  /** Outer container for avatar + badge — does NOT clip so badge is visible */
  avatarOuter: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    marginRight: 8,
    flexShrink: 0,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Inner container ensures avatar is always correctly clipped to circle */
  avatarClip: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  verifiedBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  groupBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 0,
    fontSize: 15,
    color: colors.text,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    maxWidth: "36%",
    gap: 3,
    justifyContent: "flex-end",
  },
  time: {
    textAlign: "right",
    minWidth: 30,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    gap: spacing.xs,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
  },
});
