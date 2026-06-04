export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 18,
  full: 9999,
} as const;

export type RadiusName = keyof typeof radius;
