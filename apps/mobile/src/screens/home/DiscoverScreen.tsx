import { DISCOVER_FEATURES } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2 dark:border-slate-800 dark:bg-slate-900">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Khám phá</Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Mini app, dịch vụ và nhiều hơn nữa
        </Text>
      </View>
      <FlatList
        data={DISCOVER_FEATURES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-4"
        contentContainerClassName="gap-3 py-4"
        renderItem={({ item }) => (
          <View className="mb-3 min-h-[120px] flex-1 overflow-hidden rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-zalo/10">
              <Ionicons name={item.icon as IconName} size={26} color="#0085FF" />
            </View>
            <Text className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{item.subtitle}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
