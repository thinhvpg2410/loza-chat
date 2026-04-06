import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, headerSeparator, spacing } from "@theme";

const HEADER_MIN_HEIGHT = 44;

type ShellHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Extra bottom padding under title row */
  bottomPadding?: number;
};

export function ShellHeader({ title, subtitle, left, right, bottomPadding = spacing.sm }: ShellHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        headerSeparator,
        {
          paddingTop: insets.top,
          paddingBottom: bottomPadding,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: HEADER_MIN_HEIGHT,
        }}
      >
        <View style={{ width: 72, alignItems: "flex-start", justifyContent: "center" }}>{left}</View>
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing.xs }}>
          <AppText variant="headline" numberOfLines={1} style={{ fontWeight: "600", color: colors.text }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="micro" color="textMuted" numberOfLines={1} style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={{ width: 72, alignItems: "flex-end", justifyContent: "center" }}>{right}</View>
      </View>
    </View>
  );
}
