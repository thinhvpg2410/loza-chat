import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type ChatGroupEventRowProps = {
  badge: string;
  detail?: string;
};

function UnpackedChatGroupEventRow({ badge, detail }: ChatGroupEventRowProps) {
  return (
    <View style={styles.wrap}>
      {detail ? (
        <AppText variant="caption" color="textSecondary" style={styles.detail} numberOfLines={5}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

export const ChatGroupEventRow = memo(UnpackedChatGroupEventRow);

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    maxWidth: "92%",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#BFDBFE",
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 14,
    color: colors.primaryPressed,
    textAlign: "center",
  },
  detail: {
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
});
