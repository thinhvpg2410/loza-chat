import type { ReactNode } from "react";
import type { Edge } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@theme";

type AppTabScreenProps = {
  children: ReactNode;
  /** Safe area edges (tab bar handles bottom). */
  edges?: Edge[];
  backgroundColor?: string;
};

export function AppTabScreen({
  children,
  edges = ["top", "left", "right"],
  backgroundColor = colors.background,
}: AppTabScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
