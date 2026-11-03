# ADR 0003 — Styling is separated from implementation

**Date:** 3 November 2026  
**Status:** Accepted (product-owner direction)

## Context

Feature and UI components previously defined their `StyleSheet` objects in the
same file as behavior and JSX. The product owner asked for styling to be kept
out of implementation files so it can be imported and maintained separately.
This intentionally overrides the earlier "keep styles near the component"
guidance.

## Decision

- All static `StyleSheet` definitions live in `src/styles`, mirroring the
  feature/shared structure:
  - `src/styles/shared/ui/<Component>.styles.ts`
  - `src/styles/features/<feature>/<Component>.styles.ts`
- Components import their styles:
  `import { styles } from "@/styles/features/folders/FolderCard.styles";`
- Theme-dependent dynamic values (colors that change with light/dark mode) and
  state-driven style selection remain in the component, because they depend on
  runtime theme/state rather than static layout.
- Style files import design tokens from `@/theme`; no raw tokens are duplicated
  across feature files.
- This is a pure code-organization change and must not alter rendered behavior.

## Consequences

- Feature files are shorter and contain behavior/JSX only.
- Style edits are made in one predictable tree.
- New components must add their style file under `src/styles` instead of
  defining `StyleSheet.create` in the component file.
