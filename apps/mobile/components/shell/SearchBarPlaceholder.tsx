import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type SearchBarPlaceholderProps = {
  onPress?: () => void;
  hint?: string;
};

export function SearchBarPlaceholder({
  onPress,
  hint = "Tìm kiếm",
}: SearchBarPlaceholderProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <AppText variant="subhead" color="textPlaceholder" style={{ marginLeft: spacing.sm, flex: 1 }}>
        {hint}
      </AppText>
    </Pressable>
  );
}
