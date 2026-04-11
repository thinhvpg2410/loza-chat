import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import type { MockConversation } from "@/constants/mockData";
import { AppText } from "@ui/AppText";
import { UnreadBadge } from "./UnreadBadge";
import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

/** Zalo-like: dense row, avatar balanced to 15px title */
const AVATAR_SIZE = 40;

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
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => [
        styles.row,
        hairlineBottomBorder,
        {
          backgroundColor:
            Platform.OS === "ios"
              ? pressed
                ? "rgba(0,0,0,0.03)"
                : colors.background
              : colors.background,
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: item.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={160}
        />
        {isGroup ? (
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={9} color={colors.textInverse} />
          </View>
        ) : null}
        {!isGroup && item.isOnline && !item.verified ? <View style={styles.onlineDot} /> : null}
        {!isGroup && item.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={9} color={colors.textInverse} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <AppText
            variant="headline"
            numberOfLines={1}
            style={[
              styles.name,
              hasUnread ? { fontWeight: "700", color: colors.text } : { fontWeight: "600", color: colors.text },
            ]}
          >
            {item.name}
          </AppText>
          <View style={styles.metaRight}>
            {item.isPinned ? (
              <Ionicons name="pin" size={12} color={colors.textMuted} />
            ) : null}
            {item.isMuted ? (
              <Ionicons name="volume-mute-outline" size={12} color={colors.textMuted} />
            ) : null}
            <AppText
              variant="micro"
              color="textPlaceholder"
              numberOfLines={1}
              ellipsizeMode="tail"
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
                color: previewMuted ? colors.textMuted : colors.textPlaceholder,
                fontWeight: hasUnread ? "500" : "400",
                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
              },
            ]}
          >
            {isGroup && item.memberCount != null ? `${item.memberCount} · ${item.lastMessage}` : item.lastMessage}
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
    paddingVertical: 4,
    minHeight: 52,
  },
  avatarWrap: {
    position: "relative",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginRight: spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  verifiedBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  groupBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
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
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    maxWidth: "38%",
    gap: 3,
    justifyContent: "flex-end",
  },
  time: {
    fontWeight: "400",
    textAlign: "right",
    minWidth: 28,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    gap: spacing.xs,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    paddingVertical: 0,
  },
});
