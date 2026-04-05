import type { MockPost } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type PostCardProps = {
  post: MockPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <View className="flex-row items-center px-4 pt-4">
        <Image
          source={{ uri: post.authorAvatar }}
          className="mr-3 h-10 w-10 rounded-full bg-slate-200"
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="font-semibold text-slate-900 dark:text-white">{post.authorName}</Text>
          <Text className="text-xs text-slate-400">{post.timeLabel}</Text>
        </View>
        <Pressable hitSlop={8} className="p-1 active:opacity-60">
          <Ionicons name="ellipsis-horizontal" size={22} color="#64748b" />
        </Pressable>
      </View>
      <Text className="px-4 pb-3 pt-2 text-base leading-6 text-slate-800 dark:text-slate-100">
        {post.content}
      </Text>
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          className="aspect-[16/10] w-full bg-slate-100"
          contentFit="cover"
        />
      ) : null}
      <View className="flex-row items-center border-t border-slate-100 px-3 py-2 dark:border-slate-800">
        <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-2 active:opacity-70">
          <Ionicons name="heart-outline" size={22} color="#64748b" />
          <Text className="text-sm text-slate-600 dark:text-slate-300">{post.likes}</Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-2 active:opacity-70">
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text className="text-sm text-slate-600 dark:text-slate-300">{post.comments}</Text>
        </Pressable>
      </View>
    </View>
  );
}
