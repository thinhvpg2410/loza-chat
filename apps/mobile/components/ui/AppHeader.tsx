import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, headerSeparator, spacing } from "@theme";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Include safe-area top inset (use when header is the root under status bar) */
  safeTop?: boolean;
  style?: ViewStyle;
};

export function AppHeader({
  title,
  subtitle,
  left,
  right,
  safeTop = false,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = safeTop ? insets.top : 0;

  return (
    <View
      style={[
        headerSeparator,
        {
          paddingTop,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 44,
        }}
      >
        <View style={{ width: 72, alignItems: "flex-start" }}>{left}</View>
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing.xs }}>
          <AppText variant="title" color="text" numberOfLines={1} style={{ fontWeight: "600" }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={{ width: 72, alignItems: "flex-end" }}>{right}</View>
      </View>
    </View>
  );
}
