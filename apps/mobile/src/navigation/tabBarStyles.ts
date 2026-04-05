import { Platform, type ViewStyle } from "react-native";

export const mainTabBarStyle: ViewStyle = {
  backgroundColor: "#ffffff",
  borderTopWidth: 1,
  borderTopColor: "#e5e7eb",
  paddingTop: 6,
  height: Platform.select({ ios: 88, default: 64 }),
};
