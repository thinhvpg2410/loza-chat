import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@theme";

type AppScreenProps = Omit<ViewProps, "children"> & {
  children: ReactNode;
  /** Scroll content; when false, children are laid out in a plain column */
  scroll?: boolean;
  safeEdges?: Edge[];
  backgroundColor?: string;
  /** Horizontal padding using spacing token */
  horizontalPadding?: keyof typeof spacing;
  keyboardOffset?: number;
  scrollViewProps?: Omit<ScrollViewProps, "children">;
};

export function AppScreen({
  children,
  scroll = false,
  safeEdges = ["top", "left", "right"],
  backgroundColor = colors.background,
  horizontalPadding = "none",
  keyboardOffset,
  scrollViewProps,
  style,
  ...rest
}: AppScreenProps) {
  const pad = spacing[horizontalPadding];
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: pad,
          paddingBottom: spacing.lg,
          flexGrow: 1,
        },
        scrollViewProps?.contentContainerStyle,
      ]}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: pad }]}>{children}</View>
  );

  const keyboardVerticalOffset =
    keyboardOffset ?? (Platform.OS === "ios" ? 0 : 20);

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor }, style]}
      edges={safeEdges}
      {...rest}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
