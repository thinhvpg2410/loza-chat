import { Platform, StyleSheet, type ViewStyle } from "react-native";

import { colors } from "./colors";

type ShadowLevel = "none" | "hairline" | "sm" | "md";

const hairline: ViewStyle =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.06,
        shadowRadius: 0,
      }
    : { elevation: 0 };

const sm: ViewStyle =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      }
    : { elevation: 1 };

const md: ViewStyle =
  Platform.OS === "ios"
    ? {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    : { elevation: 2 };

/**
 * Minimal elevation — prefer borders over heavy shadows (Zalo-like).
 */
export const shadows: Record<ShadowLevel, ViewStyle> = {
  none: {},
  hairline,
  sm,
  md,
};

/** Subtle header separator without relying on shadow. */
export const headerSeparator: ViewStyle = {
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.border,
};
