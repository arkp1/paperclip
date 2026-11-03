# ADR 0004 — Motion: movement and scale, never fades

**Date:** 3 November 2026  
**Status:** Accepted (product-owner direction)

## Context

The app previously used fades for dialogs, tab selection, and image loading, and
Android ripples on custom rounded surfaces could show a rectangular outline.
The product owner requires animations throughout, explicitly without fade
in/out, and without the rectangular ripple artifact on the Save-link pill.

## Decision

- No opacity/fade transitions. Use translation, scale, and width/position
  changes instead.
- Primary tab navigation: the active capsule indicator can be **dragged across
  tabs** (finger-following), snaps to the nearest tab, and slides on selection;
  icons scale; tab scenes slide.
- The bookmark layout selector behaves the same way: drag the indicator across
  the Grid/List/Cards icons, release to select.
- Changing layout or sort order runs a **directional horizontal page slide**
  (right for a later icon, left for an earlier one) with no opacity change.
- Dialogs slide into place (`Modal` slide); pushed routes slide.
- Card, FAB, icon-button, folder-row, and action-row presses animate scale
  instead of ripple/opacity. Android ripples are removed from custom surfaces.
- Images render without fade transitions.
- `useReducedMotion` tracks the system "Remove animations" setting and skips
  movement while preserving layout and state.

## Consequences

- Motion is consistent and tactile without fades.
- The sliding tab indicator depends on measured tab widths, so it stays aligned
  with font scaling.
- Reduced-motion users get direct state changes instead of movement.
