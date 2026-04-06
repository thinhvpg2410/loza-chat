import { View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius } from "@theme";

type UnreadBadgeProps = {
  count: number;
};

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <View
      style={{
        minWidth: 15,
        height: 15,
        paddingHorizontal: label.length > 1 ? 4 : 3,
        borderRadius: radius.full,
        backgroundColor: colors.danger,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="micro" color="textInverse" style={{ fontSize: 9, lineHeight: 11, fontWeight: "700" }}>
        {label}
      </AppText>
    </View>
  );
}
