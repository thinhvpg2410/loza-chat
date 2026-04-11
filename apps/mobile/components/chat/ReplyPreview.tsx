import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import type { ReplyReference } from "@features/chat-room/types";
import { colors, spacing } from "@theme";

/** Gray strip inside a text bubble */
export function ReplyInline({ reply }: { reply: ReplyReference }) {
  return (
    <View style={styles.inlineWrap}>
      <View style={styles.inlineBar} />
      <View style={styles.inlineText}>
        <AppText variant="micro" color="textSecondary" numberOfLines={1} style={styles.inlineLabel}>
          {reply.senderLabel}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={2}>
          {reply.preview}
        </AppText>
      </View>
    </View>
  );
}

type ReplyPreviewBannerProps = {
  reply: ReplyReference;
  onClose: () => void;
};

/** Above composer when replying */
export function ReplyPreviewBanner({ reply, onClose }: ReplyPreviewBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerInner}>
        <View style={styles.bannerBar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="micro" color="textSecondary" numberOfLines={1}>
            Trả lời {reply.senderLabel}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {reply.preview}
          </AppText>
        </View>
        <Pressable accessibilityLabel="Bỏ trả lời" hitSlop={8} onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    flexDirection: "row",
    marginBottom: 4,
    maxWidth: "100%",
  },
  inlineBar: {
    width: 2,
    borderRadius: 2,
    backgroundColor: colors.primaryMuted,
    marginRight: 6,
  },
  inlineText: {
    flex: 1,
    minWidth: 0,
  },
  inlineLabel: {
    fontWeight: "600",
    marginBottom: 1,
  },
  banner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.chatBubbleIncomingBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bannerBar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: colors.primary,
    minHeight: 32,
  },
});
