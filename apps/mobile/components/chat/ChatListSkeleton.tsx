import { View } from "react-native";

import { colors, hairlineBottomBorder, radius, spacing } from "@theme";

/** Matches `ChatListItem` metrics */
const AVATAR = 40;
const ROWS = 10;

export function ChatListSkeleton() {
  return (
    <View>
      {Array.from({ length: ROWS }).map((_, i) => (
        <View
          key={i}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
              minHeight: 52,
              backgroundColor: colors.background,
            },
            hairlineBottomBorder,
          ]}
        >
          <View
            style={{
              width: AVATAR,
              height: AVATAR,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceSecondary,
              marginRight: spacing.sm,
            }}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                height: 12,
                width: i % 3 === 0 ? "68%" : "52%",
                borderRadius: 3,
                backgroundColor: colors.surfaceSecondary,
              }}
            />
            <View
              style={{
                marginTop: 3,
                height: 10,
                width: "85%",
                borderRadius: 3,
                backgroundColor: colors.surface,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
