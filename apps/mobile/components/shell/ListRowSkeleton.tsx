import { View } from "react-native";

import { colors, radius, spacing } from "@theme";

type ListRowSkeletonProps = {
  count?: number;
};

export function ListRowSkeleton({ count = 6 }: ListRowSkeletonProps) {
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceSecondary,
            }}
          />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View
              style={{
                height: 13,
                width: i % 2 === 0 ? "72%" : "58%",
                borderRadius: 4,
                backgroundColor: colors.surfaceSecondary,
              }}
            />
            <View
              style={{
                marginTop: 8,
                height: 11,
                width: "40%",
                borderRadius: 4,
                backgroundColor: colors.surface,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
