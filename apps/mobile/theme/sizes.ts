/**
 * Avatar and icon presets for list rows, headers, and chat bubbles.
 */
export const avatarSizes = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 52,
  xl: 64,
} as const;

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
} as const;

export type AvatarSizeName = keyof typeof avatarSizes;
export type IconSizeName = keyof typeof iconSizes;
