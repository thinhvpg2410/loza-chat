import { View, type ViewStyle } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type AppBadgeProps = {
  /** Numeric or short label (e.g. "9+") */
  count?: number | string;
  /** Dot-only indicator (no label) */
  dot?: boolean;
  variant?: "primary" | "danger";
  style?: ViewStyle;
};

export function AppBadge({ count, dot = false, variant = "danger", style }: AppBadgeProps) {
  const bg = variant === "primary" ? colors.primary : colors.danger;

  if (dot) {
    return (
      <View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: radius.full,
            backgroundColor: bg,
          },
          style,
        ]}
      />
    );
  }

  const label =
    typeof count === "number" ? (count > 99 ? "99+" : String(count)) : count ?? "";

  if (label === "" && !dot) {
    return null;
  }

  return (
    <View
      style={[
        {
          minWidth: 18,
          height: 18,
          paddingHorizontal: spacing.xs,
          borderRadius: radius.full,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <AppText variant="micro" color="textInverse" style={{ fontSize: 10, lineHeight: 12 }}>
        {label}
      </AppText>
    </View>
  );
}
