import { View } from "react-native";

function SkeletonRow() {
  return (
    <View className="flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <View className="mr-3 h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
      <View className="flex-1">
        <View className="mb-2 h-4 w-[45%] rounded-md bg-slate-200 dark:bg-slate-700" />
        <View className="h-3 w-[72%] rounded-md bg-slate-100 dark:bg-slate-800" />
      </View>
    </View>
  );
}

export function ChatListSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-950">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
