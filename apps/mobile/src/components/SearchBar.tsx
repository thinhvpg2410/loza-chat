import { Ionicons } from "@expo/vector-icons";
import type { PressableProps } from "react-native";
import { Pressable, Text } from "react-native";

type SearchBarProps = Omit<PressableProps, "children"> & {
  placeholder?: string;
};

export function SearchBar({
  placeholder = "Tìm tin nhắn, bạn bè",
  className,
  ...rest
}: SearchBarProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      className={[
        "flex-row items-center rounded-full bg-white/20 px-3 py-2.5 active:bg-white/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <Ionicons name="search" size={20} color="rgba(255,255,255,0.95)" />
      <Text className="ml-2 flex-1 text-base text-white/90" numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  );
}
