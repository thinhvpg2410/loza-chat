import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md";

type AppButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Slightly shorter primary-style CTA (e.g. auth). */
  compact?: boolean;
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; textVariant: "subhead" | "body" }> = {
  sm: {
    container: {
      minHeight: 36,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    textVariant: "subhead",
  },
  md: {
    container: {
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    textVariant: "body",
  },
};

function variantStyles(variant: ButtonVariant): { container: ViewStyle; labelColor: keyof typeof colors } {
  switch (variant) {
    case "primary":
      return {
        container: {
          backgroundColor: colors.primary,
          borderWidth: 0,
        },
        labelColor: "textInverse",
      };
    case "secondary":
      return {
        container: {
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        labelColor: "text",
      };
    case "outline":
      return {
        container: {
          backgroundColor: colors.background,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.primary,
        },
        labelColor: "primary",
      };
    case "ghost":
      return {
        container: {
          backgroundColor: "transparent",
          borderWidth: 0,
        },
        labelColor: "primary",
      };
  }
}

function spinnerColor(variant: ButtonVariant): string {
  switch (variant) {
    case "primary":
      return colors.textInverse;
    case "secondary":
      return colors.primary;
    case "outline":
    case "ghost":
      return colors.primary;
  }
}

export function AppButton({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  compact = false,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const vs = variantStyles(variant);
  const sz = sizeStyles[size];
  const compactPad: ViewStyle =
    compact && size === "md"
      ? { minHeight: 40, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }
      : {};

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => {
        const base: StyleProp<ViewStyle> = [
          {
            borderRadius: radius.lg,
            alignItems: "center",
            justifyContent: "center",
            opacity: isDisabled ? 0.5 : 1,
            ...(pressed && variant !== "ghost" ? { opacity: isDisabled ? 0.5 : 0.92 } : null),
          },
          vs.container,
          sz.container,
          compactPad,
          style as ViewStyle,
        ];
        return base;
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor(variant)} size="small" />
      ) : (
        <AppText
          variant={compact && size === "md" ? "subhead" : sz.textVariant}
          color={vs.labelColor}
          style={{ fontWeight: "600" }}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
