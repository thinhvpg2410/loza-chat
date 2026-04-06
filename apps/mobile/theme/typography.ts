import type { TextStyle } from "react-native";

/**
 * Compact typography tuned for mobile chat (avoid oversized display text).
 */
export const typography = {
  /** Nav / screen titles */
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  } satisfies TextStyle,
  /** Section headers, row titles */
  headline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  } satisfies TextStyle,
  /** Primary body in lists and chat */
  body: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "400",
  } satisfies TextStyle,
  /** Secondary lines, subtitles */
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  } satisfies TextStyle,
  /** Timestamps, hints */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  } satisfies TextStyle,
  /** Tiny meta (badges, counts) */
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
