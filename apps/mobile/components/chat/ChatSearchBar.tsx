import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, TextInput, View } from "react-native";

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
    <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          paddingLeft: 10,
          paddingRight: value.length > 0 ? 4 : 12,
          minHeight: 38,
        }}
      >
        <Ionicons name="search-outline" size={17} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            marginLeft: 6,
            paddingVertical: Platform.OS === "ios" ? 0 : spacing.xs,
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
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 7,
            })}
          >
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
