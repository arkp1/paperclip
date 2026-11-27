# Paperclip Motion System

Motion follows Material 3 Expressive principles: short, directional, tactile,
and restrained. Animation should explain a state change rather than decorate it.

## Tokens

Shared durations and interaction values live in `src/theme/motion.ts`.

- `quick` / `standard` — small state changes and navigation.
- `dialogIn` / `dialogOut` — dialog enter/exit timing.
- `menuIn` / `menuOut` — anchored menu motion.
- `settingsIn` / `settingsOut` — reader and appearance surfaces.
- `immersive` — full-screen reader transitions.
- `pressScale` — default tactile press target.

## Interaction primitives

- `ScalePressable` provides radial ink and a clamped spring press scale.
- `AnimatedLayoutChange` provides directional layout swaps without opacity.
- `AppDialog`, `OverflowMenu`, and `SaveLinkSheet` own overlay dimming,
  spring entrance, deterministic dismissal, insets, and Back handling.

## Spring conventions

- Press feedback: high stiffness, short travel, no visible overshoot.
- Dialog/menu entrance: clamped spring, scale from roughly 0.93 to 1.
- Bottom-sheet opening: clamped height spring; dismissal uses timing so a
  transparent overlay cannot flash or linger.
- Reduced motion disables travel, scale, and ink duration where supported.

## Haptics

`src/shared/utils/haptics.ts` wraps `expo-haptics` and never blocks an
interaction when the module or hardware is unavailable.

Use haptics only for meaningful state changes:

- Navigation selection.
- Save success.
- Favourite toggle.
- Folder creation/deletion and colour selection.
- Clipboard copy.
- Private vault unlock.
- Destructive-operation success or failure.

Do not add haptics to every card press, scroll, or repeated gesture.

## Performance rules

- Animate transforms and opacity; avoid width/height except where a sheet’s
  visible viewport must change.
- Keep gesture-driven values on the Reanimated UI thread.
- Do not update React state per animation frame.
- Keep list data mounted when changing presentation; avoid remounting FlatLists.
- Memoise reader pagination and only recompute when content or typography
  changes.
