import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors, spacing } from "@theme";

type AppDividerProps = {
  /** Extra vertical margin */
  verticalSpacing?: keyof typeof spacing;
  /** Indent from the left (e.g. for list rows with avatar) */
  insetLeft?: number;
  style?: ViewStyle;
};

export function AppDivider({
  verticalSpacing = "none",
  insetLeft = 0,
  style,
}: AppDividerProps) {
  const marginVertical = spacing[verticalSpacing];

  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginVertical,
          marginLeft: insetLeft,
        },
        style,
      ]}
    />
  );
}
