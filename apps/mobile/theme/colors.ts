/**
 * Zalo-adjacent palette: soft blue primary, white/light gray surfaces, muted text.
 */
export const colors = {
  primary: "#0B84FF",
  primaryPressed: "#0870D9",
  primaryMuted: "#E8F3FF",

  background: "#FFFFFF",
  surface: "#F5F6F8",
  surfaceSecondary: "#EEF0F3",

  border: "#E6E8EB",
  borderStrong: "#D8DCE0",

  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textPlaceholder: "#B0B6BF",
  textInverse: "#FFFFFF",

  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",

  overlay: "rgba(0, 0, 0, 0.45)",
  scrim: "rgba(0, 0, 0, 0.06)",

  /** Chat room — Zalo-like soft surfaces */
  chatRoomBackground: "#F0F2F5",
  /** Incoming: clean white on room bg */
  chatBubbleIncoming: "#FFFFFF",
  /** Hairline around incoming bubble — lighter than `border` */
  chatBubbleIncomingBorder: "#E6E9ED",
  /** Outgoing: soft blue-gray (softer than saturated tint) */
  chatBubbleOutgoing: "#E8F0FA",
} as const;

export type ColorName = keyof typeof colors;
