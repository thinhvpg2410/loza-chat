import { Button } from "@/components/Button";
import type { RootStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/store/authStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 justify-center px-6">
        <Text className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-white">
          Xin chào{user?.name ? `, ${user.name}` : ""}
        </Text>
        <Text className="mb-10 text-center text-base text-slate-600 dark:text-slate-300">
          Bạn đã đăng nhập thành công.
        </Text>
        <Button title="Đăng xuất" variant="ghost" onPress={() => void handleLogout()} />
      </View>
    </SafeAreaView>
  );
}
