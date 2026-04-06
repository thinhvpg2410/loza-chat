import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@theme";

type AppScreenProps = Omit<ViewProps, "children"> & {
  children: ReactNode;
  /** Scroll content; when false, children are laid out in a plain column */
  scroll?: boolean;
  /**
   * Khi `scroll` + `footer`: phần cuộn chỉ chứa `children`, CTA/links nằm cố định dưới
   * (tránh nút bị đẩy khỏi viewport trên iOS).
   */
  footer?: ReactNode;
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
  footer,
  safeEdges = ["top", "left", "right"],
  backgroundColor = colors.background,
  horizontalPadding = "none",
  keyboardOffset,
  scrollViewProps,
  style,
  ...rest
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = spacing[horizontalPadding];

  /** Khi không dùng edge bottom của SafeAreaView, bù vùng home indicator trong nội dung. */
  const bottomPadForContent = safeEdges.includes("bottom") ? 0 : insets.bottom;

  const { contentContainerStyle: scrollContentExtra, ...scrollRest } = scrollViewProps ?? {};

  const keyboardVerticalOffset =
    keyboardOffset ?? (Platform.OS === "ios" ? 0 : 20);

  const scrollContentPaddingBottom = footer ? spacing.md : spacing.lg + bottomPadForContent;

  const scrollContentStyle = [
    {
      paddingHorizontal: pad,
      paddingBottom: scrollContentPaddingBottom,
    },
    scrollContentExtra,
  ];

  const scrollViewCommon = {
    keyboardShouldPersistTaps: "handled" as const,
    showsVerticalScrollIndicator: false,
    keyboardDismissMode: Platform.OS === "ios" ? ("interactive" as const) : ("on-drag" as const),
    automaticallyAdjustKeyboardInsets: Platform.OS === "ios",
    contentContainerStyle: scrollContentStyle,
    ...scrollRest,
  };

  const plainInner = (
    <View
      style={{
        flex: 1,
        paddingHorizontal: pad,
        paddingBottom: bottomPadForContent,
      }}
    >
      {children}
    </View>
  );

  if (scroll && footer) {
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
          <ScrollView style={{ flex: 1 }} {...scrollViewCommon}>
            {children}
          </ScrollView>
          <View
            style={{
              paddingHorizontal: pad,
              paddingTop: spacing.sm,
              paddingBottom: spacing.lg + bottomPadForContent,
              backgroundColor,
            }}
          >
            {footer}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const scrollInner = <ScrollView {...scrollViewCommon}>{children}</ScrollView>;

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor }, style]}
      edges={safeEdges}
      {...rest}
    >
      {scroll ? (
        scrollInner
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {plainInner}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
