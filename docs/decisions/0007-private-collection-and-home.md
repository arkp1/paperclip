# ADR 0007 — Private collection and Home carousels

**Date:** 4 November 2026  
**Status:** Accepted (product-owner direction)

## Decision

- Private folders no longer appear as `is_private` items in Home, Folders, pickers,
  or folder cards. There is one **Private** entry in the 2×2 smart-collection
  grid alongside All bookmarks, Favourites, and Uncategorized.
- Opening Private presents the device biometric/credential prompt once; success
  opens the private-folder list directly. There is no intermediate unlock page.
  The session clears when the app leaves the foreground.
- All four smart collections use a compact 2×2 grid.
- Home's Recent folders and Recently saved sections are horizontal carousels of
  up to four items. A View all action is shown only when the section has items.
- Folder Details no longer renders a large folder-name/count header; the top app
  bar carries the folder name.

## Security note

The private collection is an app-level biometric gate, not encryption. Private
rows and preview images remain in the normal app database/filesystem. This
remains the product owner's explicitly selected interim level.
