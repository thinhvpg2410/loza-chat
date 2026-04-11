import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import type { MessageReaction } from "@features/chat-room/types";
import { colors, radius } from "@theme";

type ReactionBarProps = {
  reactions?: MessageReaction[];
  onPressEmoji?: (emoji: string) => void;
};

function UnpackedReactionBar({ reactions, onPressEmoji }: ReactionBarProps) {
  if (!reactions?.length) return null;

  return (
    <View style={styles.row}>
      {reactions.map((r) => (
        <Pressable
          key={r.emoji}
          accessibilityRole="button"
          accessibilityLabel={`${r.emoji} ${r.count}`}
          onPress={() => onPressEmoji?.(r.emoji)}
          style={({ pressed }) => [
            styles.chip,
            r.reactedByMe && styles.chipMine,
            pressed && styles.chipPressed,
          ]}
        >
          <AppText style={styles.emoji}>{r.emoji}</AppText>
          <AppText variant="micro" color="textSecondary" style={styles.count}>
            {r.count}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export const ReactionBar = memo(UnpackedReactionBar);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginTop: 2,
    maxWidth: 240,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 2,
  },
  chipMine: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryMuted,
  },
  chipPressed: {
    opacity: 0.85,
  },
  emoji: {
    fontSize: 11,
    lineHeight: 13,
  },
  count: {
    fontWeight: "600",
    fontSize: 10,
    lineHeight: 12,
  },
});
