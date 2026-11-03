# ADR 0002 — Recently saved on Home

**Date:** 3 November 2026  
**Status:** Accepted (product-owner decision)

## Context

The original written contract (`AGENTS.md`, PRD, UI/UX specification, user
flows, and architecture guide) excluded all bookmark content from Home: recent
folders only, no recently saved section, no See All. The Figma exploration
showed a "Recently saved" preview, but the written contract took precedence.

After using the app, the product owner explicitly approved a change: Home should
show recently saved links as well.

## Decision

- Home keeps the recent-folders surface (up to six folders).
- Home adds a **Recently saved** preview of up to **four public bookmarks**,
  using the normal bookmark card, followed by a **View all** action that opens
  All bookmarks.
- The preview uses the public bookmark repository query, so locked private
  content can never appear there.
- Home still has no search field, no full folder catalogue, and no See All
  action for folders.
- A save now navigates to the destination folder or Uncategorized so the new
  bookmark is immediately visible.

## Consequences

- `AGENTS.md` (contract and test expectations), the PRD, UI/UX specification,
  user flows, architecture guide, and README were updated on 3 November 2026.
- The four-item limit is a product preview limit, not the library limit; "View
  all" opens the complete collection.
- This ADR supersedes the older Home exclusions for bookmark content only.
