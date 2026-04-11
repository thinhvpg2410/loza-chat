import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@theme";

type ChatSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitFullSearch?: () => void;
};

export function ChatSearchBar({
  value,
  onChangeText,
  placeholder = "Tìm kiếm",
  onSubmitFullSearch,
}: ChatSearchBarProps) {
  return (
    <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chatBubbleIncomingBorder,
          backgroundColor: colors.background,
          paddingLeft: spacing.sm,
          paddingRight: spacing.xs,
          minHeight: 34,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            marginLeft: spacing.xs,
            paddingVertical: spacing.xs,
            fontSize: 14,
            lineHeight: 18,
            color: colors.text,
          }}
          returnKeyType="search"
          onSubmitEditing={onSubmitFullSearch}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityLabel="Xóa tìm kiếm"
            hitSlop={8}
            onPress={() => onChangeText("")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: spacing.xs })}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
