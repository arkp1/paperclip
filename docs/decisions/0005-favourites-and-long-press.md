# ADR 0005 — Favourites, long-press actions, collapsing FAB

**Date:** 3 November 2026  
**Status:** Accepted (product-owner direction)

## Decision

- Saved bookmarks gain a persisted `is_favorite` flag (migration v2) and a
  **Favourites** collection page with the same view modes, sorting, and actions
  as All Bookmarks.
- Per-card three-dot menu buttons are removed. Long-pressing a bookmark opens
  the same action menu; the menu now uses a short scale-in instead of sliding up.
- The extended Save-link FAB collapses into a circular `+` while scrolling down
  and expands on scroll-up or at the top. Home and Folders both drive it from
  scroll position.
- Search requests focus after the screen transition so the Android keyboard
  opens immediately.
- Favourites are toggled from the long-press menu and shown with a heart on the
  card.

## Consequences

- Schema migration v2 adds `bookmarks.is_favorite` and an index; existing data
  is preserved with favourites defaulting to false.
- The bookmark card has fewer controls and a cleaner visual surface.
- Action menus no longer use slide transitions.
