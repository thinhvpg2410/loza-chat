import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";
import type { MockConversation, MockFriend } from "@/constants/mockData";
import type { MainStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";

type Row =
  | { kind: "section"; title: string }
  | { kind: "conversation"; item: MockConversation }
  | { kind: "friend"; item: MockFriend };

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const conversations = useChatStore((s) => s.conversations);
  const friends = useUserStore((s) => s.friends);
  const [query, setQuery] = useState("");

  const rows = useMemo((): Row[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const conv = conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q),
    );
    const fr = friends.filter((f) => f.name.toLowerCase().includes(q));

    const out: Row[] = [];
    if (conv.length) {
      out.push({ kind: "section", title: "Tin nhắn" });
      conv.forEach((item) => out.push({ kind: "conversation", item }));
    }
    if (fr.length) {
      out.push({ kind: "section", title: "Bạn bè" });
      fr.forEach((item) => out.push({ kind: "friend", item }));
    }
    return out;
  }, [conversations, friends, query]);

  const openConversation = (item: MockConversation) => {
    navigation.navigate("ChatDetail", { conversationId: item.id, title: item.name });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom"]}>
      <View className="border-b border-slate-100 px-4 pb-3 dark:border-slate-800">
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tin nhắn, bạn bè"
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 py-2.5 text-base text-slate-900 dark:text-slate-100"
          />
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row, index) => {
          if (row.kind === "section") return `s-${row.title}-${index}`;
          if (row.kind === "conversation") return `c-${row.item.id}`;
          return `f-${row.item.id}`;
        }}
        renderItem={({ item }) => {
          if (item.kind === "section") {
            return (
              <Text className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                {item.title}
              </Text>
            );
          }
          if (item.kind === "conversation") {
            return (
              <ConversationItem item={item.item} onPress={() => openConversation(item.item)} />
            );
          }
          return (
            <Pressable
              className="flex-row items-center border-b border-slate-100 px-4 py-3 active:bg-slate-50 dark:border-slate-800"
              onPress={() =>
                navigation.navigate("ChatDetail", {
                  conversationId: `friend-${item.item.id}`,
                  title: item.item.name,
                })
              }
            >
              <Image
                source={{ uri: item.item.avatarUrl }}
                className="mr-3 h-12 w-12 rounded-full bg-slate-200"
                contentFit="cover"
              />
              <Text className="flex-1 font-medium text-slate-900 dark:text-white">{item.item.name}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState title="Không có kết quả" description="Thử từ khóa khác." />
          ) : (
            <EmptyState
              title="Tìm kiếm"
              description="Nhập tên bạn bè hoặc nội dung tin nhắn."
              icon="search-outline"
            />
          )
        }
        contentContainerClassName={rows.length === 0 ? "flex-grow" : "pb-6"}
      />
    </SafeAreaView>
  );
}
