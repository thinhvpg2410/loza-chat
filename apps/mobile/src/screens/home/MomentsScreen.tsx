import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "@/store/userStore";

export function MomentsScreen() {
  const posts = useUserStore((s) => s.posts);
  const postsLoading = useUserStore((s) => s.postsLoading);
  const fetchPosts = useUserStore((s) => s.fetchPosts);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const showSkeleton = postsLoading && posts.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2 dark:border-slate-800 dark:bg-slate-900">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Nhật ký</Text>
      </View>

      {showSkeleton ? (
        <View className="px-4 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} className="mb-3 h-64 rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
          ))}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 pt-3">
              <PostCard post={item} />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <EmptyState
              icon="images-outline"
              title="Chưa có bài đăng"
              description="Theo dõi bạn bè để xem nhật ký tại đây."
            />
          }
          contentContainerClassName={posts.length === 0 ? "flex-grow pb-6" : "pb-8"}
        />
      )}
    </SafeAreaView>
  );
}
