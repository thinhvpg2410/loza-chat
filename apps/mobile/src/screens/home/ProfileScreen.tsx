import { Button } from "@/components/Button";
import { resetToAuthLogin } from "@/navigation/navigationRef";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";

const MENU_ITEMS: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "1", title: "Ví & thanh toán", icon: "wallet-outline" },
  { id: "2", title: "Cloud của tôi", icon: "cloud-outline" },
  { id: "3", title: "Quyền riêng tư", icon: "shield-checkmark-outline" },
  { id: "4", title: "Trợ giúp", icon: "help-circle-outline" },
];

export function ProfileScreen() {
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const storeUser = useUserStore((s) => s.user);

  const displayName = storeUser?.name ?? authUser?.name ?? "Người dùng";
  const avatarUri = storeUser?.avatarUrl ?? authUser?.avatarUri;

  const handleLogout = useCallback(async () => {
    await logout();
    useChatStore.getState().reset();
    useUserStore.getState().reset();
    resetToAuthLogin();
  }, [logout]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="items-center border-b border-slate-200 bg-white px-6 pb-8 pt-6 dark:border-slate-800 dark:bg-slate-900">
        <View className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-sm dark:border-slate-800">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="h-full w-full" contentFit="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-zalo/10">
              <Ionicons name="person" size={48} color="#0085FF" />
            </View>
          )}
        </View>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</Text>
        {authUser?.phone ? (
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{authUser.phone}</Text>
        ) : null}

        <View className="mt-6 w-full flex-row gap-3">
          <View className="flex-1">
            <Button title="Chỉnh sửa hồ sơ" variant="ghost" onPress={() => {}} />
          </View>
          <View className="flex-1">
            <Button title="Cài đặt" variant="ghost" onPress={() => {}} />
          </View>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(item) => item.id}
        className="mt-3 bg-white dark:bg-slate-900"
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable className="flex-row items-center border-b border-slate-100 px-4 py-4 active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-800">
            <Ionicons name={item.icon} size={24} color="#64748b" />
            <Text className="ml-3 flex-1 text-base text-slate-900 dark:text-white">{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>
        )}
      />

      <View className="mt-4 px-4">
        <Button title="Đăng xuất" variant="ghost" onPress={() => void handleLogout()} />
      </View>
    </SafeAreaView>
  );
}
