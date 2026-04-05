import { Text, View } from "react-native";

export function TypingIndicator() {
  return (
    <View className="border-t border-slate-100 bg-slate-50/95 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/95">
      <Text className="text-sm italic text-slate-500 dark:text-slate-400">Đang nhập...</Text>
    </View>
  );
}
