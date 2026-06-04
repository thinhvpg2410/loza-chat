export const colors = {
  primary: "#0B84FF",
  primaryPressed: "#0870D9",
  primaryMuted: "#E8F3FF",
  primarySurface: "#F0F7FF",

  background: "#FFFFFF",
  surface: "#F5F6F8",
  surfaceSecondary: "#ECEEF1",
  surfaceElevated: "#FFFFFF",

  border: "#E4E6EB",
  borderStrong: "#D1D5DB",

  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textPlaceholder: "#C0C6D0",
  textInverse: "#FFFFFF",

  danger: "#EF4444",
  dangerPressed: "#DC2626",
  success: "#22C55E",
  warning: "#F59E0B",

  overlay: "rgba(0, 0, 0, 0.48)",
  scrim: "rgba(0, 0, 0, 0.05)",

  /** Chat room */
  chatRoomBackground: "#EEF0F4",
  chatBubbleIncoming: "#FFFFFF",
  chatBubbleIncomingBorder: "#E2E5EA",
  chatBubbleOutgoing: "#DCE9FA",

  /** Semantic surfaces for status banners */
  dangerSurface: "#FEE2E2",
  dangerText: "#991B1B",
  warningSurface: "#FEF3C7",
  warningText: "#78350F",
  infoSurface: "#E0F2FE",
  infoText: "#075985",
  offlineSurface: "#FFF7ED",
  offlineText: "#9A3412",
  noticeSurface: "#EFF6FF",
  noticeText: "#1D4ED8",
} as const;

export type ColorName = keyof typeof colors;
