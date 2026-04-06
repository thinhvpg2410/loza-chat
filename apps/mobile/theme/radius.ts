/**
 * Small–medium radii for chips, bubbles, inputs (chat density).
 */
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

export type RadiusName = keyof typeof radius;
