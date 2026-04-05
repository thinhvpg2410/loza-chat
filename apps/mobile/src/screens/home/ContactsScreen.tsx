import { EmptyState } from "@/components/EmptyState";
import type { MockFriend } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "@/store/userStore";

function FriendRow({ item }: { item: MockFriend }) {
  return (
    <Pressable className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:active:bg-slate-900">
      <View className="relative mr-3">
        <Image
          source={{ uri: item.avatarUrl }}
          className="h-12 w-12 rounded-full bg-slate-200"
          contentFit="cover"
        />
        {item.isOnline ? (
          <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-slate-900 dark:text-white">{item.name}</Text>
        {item.subtitle ? (
          <Text className="text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="call-outline" size={22} color="#0085FF" />
    </Pressable>
  );
}

export function ContactsScreen() {
  const friends = useUserStore((s) => s.friends);
  const friendsLoading = useUserStore((s) => s.friendsLoading);
  const fetchFriends = useUserStore((s) => s.fetchFriends);

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  }, [fetchFriends]);

  const match = useCallback(
    (f: MockFriend) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return f.name.toLowerCase().includes(q);
    },
    [query],
  );

  const sections = useMemo(() => {
    const online = friends.filter((f) => f.isOnline && match(f));
    const rest = friends.filter((f) => !f.isOnline && match(f));
    const out: { title: string; data: MockFriend[] }[] = [];
    if (online.length) out.push({ title: "Trực tuyến", data: online });
    if (rest.length) out.push({ title: "Khác", data: rest });
    return out;
  }, [friends, match]);

  const showSkeleton = friendsLoading && friends.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-100 px-4 pb-3 pt-2 dark:border-slate-800">
        <Text className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Danh bạ</Text>
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bạn, nhóm..."
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 py-2.5 text-base text-slate-900 dark:text-slate-100"
          />
        </View>
      </View>

      {showSkeleton ? (
        <View className="px-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} className="mb-3 h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FriendRow item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-slate-50 px-4 py-2 dark:bg-slate-900">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {title}
              </Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Không tìm thấy bạn bè"
              description="Thử từ khóa khác hoặc kéo để làm mới."
            />
          }
          contentContainerClassName={sections.length === 0 ? "flex-grow" : "pb-6"}
        />
      )}
    </SafeAreaView>
  );
}
