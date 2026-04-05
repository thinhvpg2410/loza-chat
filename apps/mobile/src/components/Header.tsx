import { SearchBar } from "@/components/SearchBar";
import type { ReactNode } from "react";
import { View } from "react-native";

type HeaderProps = {
  searchPlaceholder?: string;
  onSearchPress?: () => void;
  rightIcons?: ReactNode;
  searchClassName?: string;
};

export function Header({
  searchPlaceholder,
  onSearchPress,
  rightIcons,
  searchClassName,
}: HeaderProps) {
  return (
    <View className="min-h-[60px] flex-row items-center gap-2 bg-zalo px-3 py-2">
      <View className="min-w-0 flex-1">
        <SearchBar
          placeholder={searchPlaceholder}
          onPress={onSearchPress}
          className={searchClassName}
        />
      </View>
      {rightIcons ? <View className="flex-row items-center gap-1">{rightIcons}</View> : null}
    </View>
  );
}
