import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
};

export function EmptyState({ icon = "file-tray-outline", title, description }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Ionicons name={icon} size={32} color="#94a3b8" />
      </View>
      <Text className="mb-1 text-center text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </Text>
      {description ? (
        <Text className="text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
