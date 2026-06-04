import type { TextStyle } from "react-native";

export const typography = {
  /** Large screen titles (splash, onboarding) */
  display: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  } satisfies TextStyle,
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
    fontSize: 15,
    lineHeight: 21,
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
    lineHeight: 17,
    fontWeight: "400",
  } satisfies TextStyle,
  /** Tiny meta (badges, counts) */
  micro: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
