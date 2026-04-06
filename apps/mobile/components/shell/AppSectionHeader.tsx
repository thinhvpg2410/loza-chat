import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

type AppSectionHeaderProps = {
  title: string;
  right?: ReactNode;
};

export function AppSectionHeader({ title, right }: AppSectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="caption" color="textSecondary" style={{ fontWeight: "600", letterSpacing: 0.2 }}>
        {title}
      </AppText>
      {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
    </View>
  );
}
