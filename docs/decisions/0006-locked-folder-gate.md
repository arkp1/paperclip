# ADR 0006 — Locked folders as an app-level biometric gate

**Date:** 4 November 2026  
**Status:** Accepted by product owner (interim security level)  
**Superseded in part by:** ADR 0007 (single private-space session and 2×2 grid)

## Context

The full private-folder design requires SQLCipher, Android Keystore-wrapped
keys, biometric-bound key release, encrypted preview assets, and lifecycle
protection. The product owner explicitly chose a lower-effort option: locked
folders protected by the device biometric/credential prompt, without encrypting
the database or preview files.

## Decision

- A folder can be marked `is_private`.
- Locked folder contents are excluded from All Bookmarks, Favourites, Home,
  search, counts, and folder previews at the repository query boundary.
- Opening a locked folder requires `expo-local-authentication`; device PIN /
  pattern fallback is enabled.
- Unlocked folder IDs live only in memory. The session clears when the app
  leaves the foreground.
- Folder locking is available from the folder actions menu.

## Explicit limitation

This is **not** encryption. Private rows and preview files remain in the app's
SQLite database and document storage. It does not meet the earlier
production-grade private-folder security requirement and must not be described
as encrypted. The full native security milestone is still required before
claiming that guarantee.
