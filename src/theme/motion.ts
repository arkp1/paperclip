/**
 * Motion tokens are intentionally restrained. The UI does not animate lists or
 * images, and state changes rely on short tonal transitions only.
 */
export const motion = {
  quick: 120,
  standard: 200,
  emphasized: 300,
} as const;
