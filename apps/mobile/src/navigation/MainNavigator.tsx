import { ChatDetailScreen } from "@/screens/home/ChatDetailScreen";
import { SearchScreen } from "@/screens/home/SearchScreen";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";

import { TabNavigator } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  useEffect(() => {
    useUserStore.getState().setUserFromAuth(useAuthStore.getState().user);
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Tìm kiếm", headerBackTitle: "" }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route }) => ({
          title: route.params.title,
          headerBackTitle: "",
        })}
      />
    </Stack.Navigator>
  );
}
