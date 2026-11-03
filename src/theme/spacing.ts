/** 4 dp base grid from the Paperclip design system. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

export const screenHorizontalInset = spacing[6];
export const contentHorizontalInset = spacing[6];
