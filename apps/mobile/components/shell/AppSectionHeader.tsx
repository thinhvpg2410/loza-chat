import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

type AppSectionHeaderProps = {
  title: string;
  right?: ReactNode;
  compact?: boolean;
};

export function AppSectionHeader({ title, right, compact }: AppSectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: compact ? spacing.xs : 10,
        backgroundColor: colors.surface,
      }}
    >
      <AppText
        variant="micro"
        style={{
          fontWeight: "600",
          color: colors.textSecondary,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {title}
      </AppText>
      {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
    </View>
  );
}
