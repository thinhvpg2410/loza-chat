import type { MainStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

type Props = NativeStackScreenProps<MainStackParamList, "ChatDetail">;

export function ChatDetailScreen({ route }: Props) {
  const { conversationId } = route.params;

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <View className="items-center justify-center px-8 py-16">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
          <Ionicons name="chatbubbles-outline" size={32} color="#0085FF" />
        </View>
        <Text className="text-center text-lg font-semibold text-slate-800 dark:text-slate-100">
          Cuộc trò chuyện
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          ID: {conversationId}
        </Text>
        <Text className="mt-4 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
          Màn hình chat chi tiết — kết nối API tin nhắn tại đây.
        </Text>
      </View>
    </View>
  );
}
