import type { MockConversation } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type ConversationItemProps = {
  item: MockConversation;
  onPress: () => void;
};

export function ConversationItem({ item, onPress }: ConversationItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:active:bg-slate-900"
    >
      <View className="relative mr-3">
        <Image
          source={{ uri: item.avatarUrl }}
          className="h-14 w-14 rounded-full bg-slate-200"
          contentFit="cover"
          transition={200}
        />
        {item.verified ? (
          <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full bg-orange-500">
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <View className="mb-0.5 flex-row items-center justify-between gap-2">
          <Text className="flex-1 font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center gap-1">
            {item.isPinned ? (
              <View className="rotate-45">
                <Ionicons name="pin" size={14} color="#94a3b8" />
              </View>
            ) : null}
            <Text className="text-xs text-slate-400">{item.time}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount != null && item.unreadCount > 0 ? (
            <View className="min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5">
              <Text className="text-xs font-bold text-white">
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
