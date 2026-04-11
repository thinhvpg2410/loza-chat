import { StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type TimestampSeparatorProps = {
  label: string;
};

export function TimestampSeparator({ label }: TimestampSeparatorProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.pill}>
        <AppText variant="micro" color="textMuted" numberOfLines={1} style={styles.label}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    maxWidth: "92%",
  },
  label: {
    textAlign: "center",
    fontWeight: "500",
  },
});
