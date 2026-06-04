import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, headerSeparator, spacing } from "@theme";

const HEADER_MIN_HEIGHT = 46;

type ShellHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  bottomPadding?: number;
};

export function ShellHeader({ title, subtitle, left, right, bottomPadding = spacing.sm }: ShellHeaderProps) {
  return (
    <View
      style={[
        headerSeparator,
        {
          paddingTop: 0,
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
          <AppText variant="title" numberOfLines={1} style={{ fontWeight: "700", color: colors.text }}>
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
