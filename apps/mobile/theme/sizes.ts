export const avatarSizes = {
  xs: 30,
  sm: 38,
  md: 46,
  lg: 56,
  xl: 72,
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
