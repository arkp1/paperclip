/** Shape scale from the Paperclip design system. */
export const shapes = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  dialog: 28,
  full: 999,
} as const;

export type ShapeToken = keyof typeof shapes;
