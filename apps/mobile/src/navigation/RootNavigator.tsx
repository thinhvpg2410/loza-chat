import { ONBOARDING_COMPLETE_KEY } from "@/constants/storageKeys";
import { AuthStack } from "@/navigation/AuthStack";
import { MainNavigator } from "@/navigation/MainNavigator";
import { navigationRef } from "@/navigation/navigationRef";
import { OnboardingScreen } from "@/screens/auth/OnboardingScreen";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import type { RootStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#0068FF",
    background: "#ffffff",
    card: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    notification: "#0068FF",
  },
};

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Onboarding");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useAuthStore.getState().hydrate();
      const seen = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      const authed = useAuthStore.getState().isAuthenticated;
      if (cancelled) return;
      if (authed) setInitialRoute("Main");
      else if (seen === "true") setInitialRoute("Auth");
      else setInitialRoute("Onboarding");
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#0068FF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
