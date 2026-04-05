import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "@/navigation/types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToMain() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: "Main" }] });
  }
}

export function resetToAuthLogin() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: "Auth",
          state: {
            routes: [{ name: "Login" }],
            index: 0,
          },
        },
      ],
    });
  }
}
