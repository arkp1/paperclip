# Paperclip — Design System

**Product:** Paperclip — Android link and article saver  
**Document:** Design System  
**Version:** 1.0  
**Status:** Implementation specification  
**Platform:** Android  
**UI framework:** React Native + TypeScript  
**Design direction:** Material 3 Expressive  
**Related documents:** `Paperclip_PRD.md`, `Paperclip_TRD.md`, `Folder Structure and Code Architecture.md`, `UI_UX_SPECIFICATION.md`, `USER_FLOWS.md`, `DATABASE_SCHEMA.md`  
**Visual reference:** [Paperclip Figma design](https://www.figma.com/design/2XBBMl0bawDPNQcWXKUz9P)

---

## 1. Purpose

This document defines Paperclip's shared visual language and reusable UI patterns. It is the source of truth for colors, typography, spacing, shapes, icons, common controls, cards, navigation, sheets, dialogs, and shared components.

The goal is a consistent interface that feels native to modern Android while retaining Paperclip's own warm, calm visual identity. The implementation should use Material 3 Expressive principles, not merely apply rounded corners and a purple accent to generic React Native components.

### 1.1 Design principles

1. **Visual calm:** give content room to breathe. Avoid unnecessary decoration, borders, badges, and competing accents.
2. **Expressive, not noisy:** use expressive shapes, typography, and motion purposefully. Do not decorate every element.
3. **Content first:** bookmark previews should make saved content recognizable at a glance.
4. **Consistent interaction:** the same type of action should look and behave the same throughout the app.
5. **Progressive disclosure:** show common actions first; place less frequent actions in menus or sheets.
6. **Accessible by default:** provide readable contrast, touch targets, font scaling, TalkBack labels, and reduced-motion behavior.
7. **Reusable, not over-engineered:** build a small set of useful shared components. Do not create wrappers for every individual View or introduce a component framework of our own.

### 1.2 Sources of truth

Use these sources in this order when making UI decisions:

1. This document for shared tokens and component behavior.
2. `UI_UX_SPECIFICATION.md` for screen-specific layout and content.
3. The Paperclip Figma file for visual composition and examples.
4. Official Material 3 / Android guidance for platform behavior and accessibility.

If a screen mock conflicts with accessibility or expected Android behavior, preserve the visual intent while following accessible platform behavior. Do not silently invent a new design token for one screen; update this document when a shared token genuinely needs to change.

---

## 2. Material 3 Expressive approach

### 2.1 Required direction

Use Material 3 Expressive as the design foundation:

- Semantic Material color roles rather than arbitrary colors.
- Expressive but controlled typography hierarchy.
- Purposeful shape variety and rounded containers.
- Tonal surfaces and clear visual grouping.
- Strong selected, pressed, focused, disabled, loading, and error states.
- Natural, short motion that reinforces an action or state change.
- Touch-friendly controls and accessible interaction patterns.

Do not mix Material 2 components or unrelated visual systems into the app.

### 2.2 React Native implementation note

Paperclip is a React Native application. Material 3 Expressive is the visual and interaction specification; it does not mean Jetpack Compose code should be introduced into the React Native UI.

Build the app's layouts and product-specific components with React Native. Use a compatible native Material 3 Expressive component package only after its compatibility with the repository's Expo / React Native version, New Architecture, theme behavior, accessibility, and Android build has been verified. If a required native control is unavailable or unreliable, implement a focused React Native component using the same tokens and behavior.

Do not install multiple competing component libraries. Keep one consistent component strategy and document any justified native bridge.

### 2.3 Platform behavior

- Respect Android status bar, navigation bar, edge-to-edge, and safe-area insets.
- Support Android Back consistently for screens, sheets, and dialogs.
- Prefer native-feeling ripple/pressed feedback where supported.
- Respect system font scaling and reduced-motion preferences.
- Support compact phones first; larger layouts may adapt without changing the visual language.

---

## 3. Brand and visual identity

### 3.1 Brand personality

Paperclip should feel:

- Calm and approachable.
- Personal, like a curated reading shelf.
- Organized without feeling like a business productivity tool.
- Trustworthy and private.
- Modern and distinctly Android.

Avoid a corporate dashboard look, excessive gradients, neon colors, dense data tables, or ornamental interface elements.

### 3.2 Brand palette

The default Paperclip palette is warm neutral with lavender as the primary accent. Sage, mint, peach, butter, and sky are supporting accents, mainly for folder identity and visual preview fallbacks.

| Token | Hex | Intended use |
|---|---|---|
| `brand.primary` | `#6853B8` | Primary actions, selected navigation, key emphasis |
| `brand.primaryDeep` | `#49378D` | Text/icons on light primary containers |
| `brand.lavender` | `#D9CFF2` | Folder identity, soft decorative surface |
| `brand.mint` | `#C9DFD0` | Folder identity, positive/quiet accent |
| `brand.sage` | `#8FAF9B` | Supporting accent; not small text on light surfaces |
| `brand.peach` | `#F4C9B5` | Folder identity and preview artwork |
| `brand.coral` | `#D98372` | Small decorative accent; use dark text only after contrast check |
| `brand.butter` | `#F1DDAE` | Folder identity and preview artwork |
| `brand.sky` | `#C7DDE9` | Folder identity and preview artwork |
| `brand.blue` | `#6A91A7` | Supporting accent; use with contrast validation |
| `brand.lilac` | `#B9A8E2` | Dark-theme accent and preview artwork |
| `brand.ink` | `#282431` | Default light-theme text |

Accent colors are not semantic status colors. For example, a peach folder does not mean warning, and a mint folder does not automatically mean success. Use semantic roles for success, warning, and error states.

---

## 4. Semantic color tokens

Components must consume semantic tokens, not raw hex values. The values below define the initial Paperclip fallback themes. Keep token names stable even if exact values are adjusted after contrast testing.

### 4.1 Light theme

| Semantic token | Initial value | Usage |
|---|---|---|
| `background` | `#F7F4EE` | Main app canvas |
| `onBackground` | `#282431` | Main text on background |
| `surface` | `#FFFEFA` | Cards, sheets, dialogs |
| `surfaceContainerLowest` | `#FFFFFF` | Highest-emphasis surface where needed |
| `surfaceContainerLow` | `#F0ECE5` | Search fields and subtle grouped surfaces |
| `surfaceContainer` | `#EAE5DD` | Secondary containers and selected tonal areas |
| `surfaceContainerHigh` | `#E3DDD5` | Stronger grouped surface; use sparingly |
| `onSurface` | `#282431` | Primary text and icons |
| `onSurfaceVariant` | `#6F6975` | Secondary text, metadata, supporting icons |
| `outline` | `#A49DA7` | Input outlines and visible component boundaries |
| `outlineVariant` | `#E6E0D8` | Subtle dividers and low-emphasis borders |
| `primary` | `#6853B8` | Primary actions and selected states |
| `onPrimary` | `#FFFFFF` | Content on primary |
| `primaryContainer` | `#E9E2FA` | Tonal button / selected item backgrounds |
| `onPrimaryContainer` | `#49378D` | Content on primary container |
| `secondary` | `#456B57` | Supporting actions and secondary emphasis |
| `onSecondary` | `#FFFFFF` | Content on secondary |
| `secondaryContainer` | `#C9DFD0` | Supporting tonal surface |
| `onSecondaryContainer` | `#244A36` | Content on secondary container |
| `tertiary` | `#9B594A` | Occasional complementary emphasis |
| `onTertiary` | `#FFFFFF` | Content on tertiary |
| `tertiaryContainer` | `#F4C9B5` | Soft complementary surface |
| `onTertiaryContainer` | `#57352D` | Content on tertiary container |
| `error` | `#BA1A1A` | Error actions and messages |
| `onError` | `#FFFFFF` | Content on error |
| `errorContainer` | `#FFDAD6` | Error background |
| `onErrorContainer` | `#410002` | Content on error container |
| `success` | `#356B4A` | Success feedback |
| `warning` | `#805600` | Warning feedback |

### 4.2 Dark theme

| Semantic token | Initial value | Usage |
|---|---|---|
| `background` | `#252331` | Main app canvas |
| `onBackground` | `#F4F0FA` | Main text on background |
| `surface` | `#252331` | Main surface |
| `surfaceContainerLowest` | `#201F2A` | Lowest surface layer |
| `surfaceContainerLow` | `#302D3E` | Cards and grouped surfaces |
| `surfaceContainer` | `#343043` | Secondary containers |
| `surfaceContainerHigh` | `#3A3548` | Elevated/stronger containers |
| `onSurface` | `#F4F0FA` | Primary text and icons |
| `onSurfaceVariant` | `#B9B3C4` | Secondary text and supporting icons |
| `outline` | `#938C9F` | Input outlines and component boundaries |
| `outlineVariant` | `#4A4559` | Subtle dividers and borders |
| `primary` | `#B9A8E2` | Primary actions and selected states |
| `onPrimary` | `#30234F` | Content on primary |
| `primaryContainer` | `#51466D` | Tonal button / selected item backgrounds |
| `onPrimaryContainer` | `#F2ECFF` | Content on primary container |
| `secondary` | `#A9CDB8` | Supporting actions |
| `onSecondary` | `#20372A` | Content on secondary |
| `secondaryContainer` | `#395B58` | Supporting tonal surface |
| `onSecondaryContainer` | `#D7F2E3` | Content on secondary container |
| `tertiary` | `#F0B6A3` | Complementary emphasis |
| `onTertiary` | `#482B22` | Content on tertiary |
| `tertiaryContainer` | `#68464B` | Soft complementary surface |
| `onTertiaryContainer` | `#FFDED4` | Content on tertiary container |
| `error` | `#FFB4AB` | Error actions and messages |
| `onError` | `#690005` | Content on error |
| `errorContainer` | `#93000A` | Error background |
| `onErrorContainer` | `#FFDAD6` | Content on error container |
| `success` | `#A9D5B5` | Success feedback |
| `warning` | `#F1C66D` | Warning feedback |

### 4.3 Color rules

- All components must use semantic tokens such as `colors.surface` and `colors.onSurface`.
- Do not use a brand accent directly for body text unless its contrast has been checked.
- Do not use `outlineVariant` for form outlines; use `outline` for controls that need a visible boundary.
- Dividers should be subtle and should not create a grid-like interface.
- Disabled content must remain legible; do not rely on opacity alone if it causes contrast failure.
- Use semantic `error`, `success`, and `warning` tokens for status feedback.
- Validate text contrast against its actual surface. Target WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text and meaningful non-text controls.

### 4.4 Dynamic color and theme modes

- Support `System`, `Light`, and `Dark` appearance modes.
- Use Paperclip's fallback palette when device dynamic color is unavailable or disabled.
- If Android dynamic color is implemented, expose it as a deliberate preference and map it into semantic roles. Do not let individual screens read system colors directly.
- The default visual identity should remain recognizable as Paperclip; test dynamic palettes for contrast and coherent folder/preview accents.

---

## 5. Typography

### 5.1 Typeface

Use **Roboto** as the initial typeface, following Android conventions and Material typography. Prefer the platform font when possible. Do not add a custom font dependency unless the product owner approves a specific typeface and its licensing/asset requirements.

### 5.2 Type scale

Use named typography roles. Screens should not invent arbitrary font sizes.

| Role | Size | Line height | Weight | Typical use |
|---|---:|---:|---|---|
| `displayLarge` | 57 | 64 | Regular | Rare onboarding/marketing moment |
| `displayMedium` | 45 | 52 | Regular | Large expressive hero |
| `displaySmall` | 36 | 44 | Regular | Large screen headline |
| `headlineLarge` | 32 | 40 | Regular | Major screen introduction |
| `headlineMedium` | 28 | 36 | Regular/Medium | Home greeting or screen hero |
| `headlineSmall` | 24 | 32 | Regular/Medium | Screen title |
| `titleLarge` | 22 | 28 | Medium | Section or prominent card title |
| `titleMedium` | 16 | 24 | Medium | Card title, dialog title, folder name |
| `titleSmall` | 14 | 20 | Medium | Compact card title |
| `bodyLarge` | 16 | 24 | Regular | Main body content |
| `bodyMedium` | 14 | 20 | Regular | Standard descriptions and fields |
| `bodySmall` | 12 | 16 | Regular | Metadata and secondary descriptions |
| `labelLarge` | 14 | 20 | Medium | Primary button label |
| `labelMedium` | 12 | 16 | Medium | Chips, tabs, compact controls |
| `labelSmall` | 11 | 16 | Medium | Eyebrows and supporting labels |

These are initial Material-style role values. Use the matching React Native component/theme API consistently, and verify line wrapping with Android font scaling enabled.

### 5.3 Typography rules

- Use sentence case for screen titles, buttons, folder names, and user-facing messages.
- Avoid all-caps text except for small optional section eyebrows; use it sparingly.
- Use Medium weight for emphasis rather than bolding every label.
- Avoid using very small text for essential information. Metadata may use `bodySmall` or `labelSmall`, but must remain readable.
- Limit card titles to two or three lines depending on layout. The full title must remain available on the detail/edit screen.
- Do not truncate URLs in a way that makes copy/open actions ambiguous; show the full URL in a detail surface when needed.
- Respect Android font scaling. Components must grow or scroll rather than clipping text.

---

## 6. Spacing and layout

### 6.1 Base grid

Use a **4 dp base spacing unit**. Spacing values should come from the shared scale.

| Token | Value | Typical use |
|---|---:|---|
| `space.0` | 0 dp | No spacing |
| `space.1` | 4 dp | Icon/text micro-gap |
| `space.2` | 8 dp | Compact internal gap |
| `space.3` | 12 dp | Compact card/control padding |
| `space.4` | 16 dp | Standard component gap and page inset |
| `space.5` | 20 dp | Comfortable card padding |
| `space.6` | 24 dp | Section spacing and screen grouping |
| `space.8` | 32 dp | Large section separation |
| `space.10` | 40 dp | Large layout gap |
| `space.12` | 48 dp | Major section separation |
| `space.16` | 64 dp | Rare large layout gap |

### 6.2 Layout rules

- Default phone screen horizontal inset: 20–24 dp. Use 24 dp for primary screen layouts unless the screen is intentionally dense.
- Keep repeated card gaps consistent: 12–16 dp.
- Use 24–32 dp between major sections.
- Keep text and controls aligned to a predictable content edge.
- Avoid nested card-on-card surfaces unless hierarchy requires it.
- Use safe-area insets for top and bottom content.
- The floating navigation bar must not cover scrollable content; reserve bottom content inset for the bar and safe-area area.
- Support narrow screens and large font settings. Do not hardcode layouts to one emulator width.

### 6.3 Responsive behavior

- Compact phones: use the floating bottom navigation bar.
- Larger Android screens: the same navigation destinations may adapt to a rail or wider layout if needed, without changing the destination model.
- Grid bookmark cards: use two columns on typical phones only when card width is sufficient; use one column when text or preview content becomes cramped.
- Search results: use compact list cards for efficient scanning.

---

## 7. Shapes, borders, and elevation

### 7.1 Shape scale

| Token | Radius | Usage |
|---|---:|---|
| `shape.extraSmall` | 4 dp | Small tags or compact indicators |
| `shape.small` | 8 dp | Small controls and icon containers |
| `shape.medium` | 12 dp | Inputs and compact cards |
| `shape.large` | 16 dp | Standard cards and menus |
| `shape.extraLarge` | 24 dp | Bookmark cards, larger containers |
| `shape.dialog` | 28 dp | Dialogs and prominent sheets |
| `shape.full` | 999 dp / pill | Chips, capsule navigation, pill buttons |

Use shape variety purposefully. A large bookmark card, a search field, and a small icon button should not all have the same radius.

### 7.2 Borders

- Use `outline` for controls that need a clearly visible border, especially outlined inputs.
- Use `outlineVariant` for subtle card outlines and dividers.
- Do not outline every surface. Prefer tonal separation when it communicates hierarchy clearly.
- Avoid thick borders and high-contrast boxes around every section.

### 7.3 Elevation

- Prefer tonal surface changes over large drop shadows.
- Use modest elevation for floating navigation, FABs, sheets, and dialogs when separation from content is needed.
- Do not add shadows to every bookmark or folder card.
- Ensure elevated surfaces remain distinguishable in dark theme without relying only on shadow.

---

## 8. Icons

### 8.1 Icon family

Use one consistent icon family. Preferred direction: **Material Symbols Rounded** (or a single equivalent rounded icon set that can be used consistently throughout the app).

Do not mix Material Symbols, Feather, Font Awesome, emoji, and custom unrelated icon packs in the same navigation or control set.

### 8.2 Standard sizes

| Size | Value | Usage |
|---|---:|---|
| Small | 16 dp | Inline metadata or compact affordances |
| Medium | 20 dp | Compact actions and list metadata |
| Standard | 24 dp | Main navigation and common actions |
| Large | 32 dp | Empty states or feature illustration |
| Extra large | 40–48 dp | Prominent empty-state/feature icon |

### 8.3 Icon rules

- Icons must have a clear purpose and recognizable meaning.
- Use 24 dp icons for primary navigation and common controls unless the Material component dictates otherwise.
- Use filled/selected icon variants only to communicate selected state where appropriate.
- Do not use an icon without an accessible label when it triggers an action.
- Decorative icons should be hidden from accessibility traversal.
- Prefer a folder icon plus an explicit lock indicator for private folders; do not rely on a color change alone.

### 8.4 Core icon vocabulary

Use consistent icons for:

- Home
- Folders
- Settings
- Search
- Add link
- Folder
- Locked folder / unlock
- Bookmark / link
- More actions
- Back / close
- Copy link
- Share link
- Open external link
- Move to folder
- Delete
- Edit
- Import / export
- Refresh preview
- Offline / unavailable

---

## 9. Navigation

### 9.1 Top-level navigation

Paperclip has exactly three primary destinations:

1. **Home** — recently opened folders only.
2. **Folders** — the complete folder library, including the entry point for search.
3. **Settings** — appearance, privacy, backup, and app information.

Search is a secondary screen/action reached from the Folders screen. It is not a top-level navigation destination.

### 9.2 Floating bottom navigation bar

The navigation bar is a floating capsule, not a full-width system-style bottom bar.

Requirements:

- Position it above the bottom system safe area.
- Use a rounded capsule/container with a tonal surface.
- Give it enough elevation or tonal contrast to remain legible above scrolling content.
- Show three destinations: Home, Folders, Settings.
- Use an icon and short text label for each destination.
- Provide a clear selected indicator using the primary container and primary/on-primary-container roles.
- Keep inactive states visually quiet but readable.
- Animate selection subtly and quickly; respect reduced-motion settings.
- Maintain accessible touch targets and TalkBack labels.
- The navigation bar must not overlap the last content row or FAB.

The bar should feel lightweight and detached from the screen edge, with consistent horizontal margins. It must remain stable across the three top-level destinations.

### 9.3 Navigation behavior

- Switching top-level destinations should preserve reasonable screen state where practical.
- Android Back should return from secondary routes to their parent destination.
- Search opened from Folders should return to the prior folder-library context.
- Sharing a link into Paperclip should open the Save Link flow, then return to the appropriate app context after saving/canceling.
- Do not place an Add destination in the navigation bar. Use a Floating Action Button or a clearly placed Add action.

---

## 10. Buttons

### 10.1 Button types

Use only the variants needed by the product:

| Variant | Purpose | Visual treatment |
|---|---|---|
| Filled / Primary | Main action, e.g. Save bookmark, Confirm import | `primary` background, `onPrimary` content |
| Tonal | Secondary positive action, e.g. Create folder | `primaryContainer`, `onPrimaryContainer` |
| Outlined | Alternative action, e.g. Cancel / Choose file | Transparent or surface background with `outline` border |
| Text | Low-emphasis action, e.g. Clear search | No container; `primary` content |
| Icon button | Compact contextual action | State layer / tonal background only when needed |

### 10.2 Sizing

- Standard button height: 48–56 dp depending on prominence and Material component variant.
- Minimum interactive touch target: 48 × 48 dp where practical.
- Standard horizontal content padding: 16–24 dp.
- Use a pill or expressive rounded shape for prominent actions where it matches the design.
- Button labels use `labelLarge` and sentence case.

### 10.3 Button behavior

- Every button must have a real action and a defined loading/disabled state where relevant.
- Prevent duplicate submissions while a save/import/export operation is running.
- Show progress for operations that take noticeable time.
- Do not use color alone to communicate disabled or destructive behavior.
- Destructive actions should use the semantic error role and require confirmation when data loss is possible.
- Do not make every secondary action a filled button.

---

## 11. Cards

Cards are central to Paperclip. Use separate visual patterns for bookmarks and folders; do not force both into one overloaded component.

### 11.1 Bookmark preview card — required for every bookmark

Every saved bookmark must render as a visual card. A raw URL-only row is not an acceptable primary representation.

#### Card content hierarchy

1. Preview image or designed fallback artwork.
2. Bookmark title.
3. Source/domain label.
4. Optional short description or note indicator.
5. Optional folder/date metadata when useful in that context.

#### Variants

**Grid card**
- Used for visual browsing where there is enough width.
- Prominent cover image/artwork.
- Title below the image.
- Source/domain as secondary text.
- Keep card heights and image ratios consistent within a grid.

**List card**
- Used for search results, dense folder contents, and compact lists.
- Thumbnail/cover on the left.
- Title and source/description on the right.
- Keep the entire main card easy to tap while actions remain separately accessible.

#### Preview image

- Use a consistent aspect ratio per card variant.
- Clip to the card's top corners or the defined cover container shape.
- Prefer cached local preview images.
- Show a restrained loading placeholder while metadata/image loading is in progress.
- Never show a broken-image icon or an empty blank region.
- Use a designed fallback cover based on the domain/source or a neutral Paperclip link treatment.
- Do not imply that the original Instagram media has been downloaded.

#### Card interactions

- Main tap: open the original URL through Android link resolution.
- Overflow menu: Edit, Move to folder, Copy link, Share link, Refresh preview, Delete.
- Long press may support selection only if a bulk-action flow is implemented.
- Avoid making tiny, hard-to-hit controls the only way to reach important actions.

### 11.2 Folder card

Folder cards should communicate identity and count without looking like bookmark cards.

Display:
- Folder icon or emoji identifier.
- Folder name.
- Bookmark count.
- Private lock indicator when applicable.

Behavior:
- Tap opens the folder.
- Overflow menu provides Rename, Change appearance (if supported), Lock/Unlock, and Delete.
- Folder color/icon is decorative identity, not a semantic status.
- Do not show previews or titles from private folders on public surfaces.

### 11.3 Home recent-folder cards

The Home screen displays recently accessed folders plus a four-item recently saved preview, the app identity, and an Add action/empty state as specified by the screen spec. The preview is limited to four public bookmarks and has a View all action; it is not a full feed.

- Display a small, predictable number of recent folders (initial target: up to six).
- Order by `lastOpenedAt` descending.
- Do not display a **See All** action on Home.
- Tapping a folder opens its folder detail screen.
- The Folders destination is the place to browse the complete folder collection.
- Private folders remain represented only by a safe locked tile; never leak their bookmark contents.

---

## 12. Input fields

### 12.1 Standard text field

Use a consistent Material 3 text field pattern for title, note, folder name, and manual URL entry.

States:
- Default.
- Focused.
- Filled.
- Error.
- Disabled.
- Read-only (when applicable).

Requirements:
- Visible label or persistent field context; do not rely on placeholder text as the only label.
- Clear focus indication.
- Error message placed close to the field and announced accessibly.
- Support keyboard type and return-key behavior appropriate to the field.
- Preserve user text when validation fails.
- Ensure fields remain usable with font scaling and keyboard visible.

### 12.2 URL field

- Use URL-appropriate keyboard behavior.
- Trim surrounding whitespace.
- Validate scheme and URL syntax before metadata fetching.
- Keep the original URL visible/editable in the save flow.
- Do not silently rewrite or remove meaningful query parameters.
- Show metadata/preview loading separately from field validation.
- Allow saving even when preview extraction fails.

### 12.3 Search field

- Search entry point is on the Folders screen and within folder-specific contexts where useful.
- Use a search icon, clear action, and concise placeholder.
- Search locally across title, URL/domain, description, note, and folder name.
- Display results as visual bookmark cards.
- Provide recent/empty/no-results states only if they improve the experience; do not create a complex search history system for MVP without need.

---

## 13. Bottom sheets

Use bottom sheets for short, contextual tasks that should not require a full navigation screen.

Suitable Paperclip use cases:
- Choose a folder when saving or moving a bookmark.
- Show bookmark overflow actions.
- Offer quick sort/filter options.
- Choose an icon/color if folder customization is included.
- Present a short action menu.

Requirements:
- Use a rounded top shape consistent with `shape.dialog` / extra-large shapes.
- Use a clear title or short description when the task needs context.
- Keep primary actions visible and reachable.
- Support swipe-to-dismiss only when dismissal will not lose entered data.
- Android Back and outside-tap dismissal should follow the same safe behavior.
- Use a drag handle where appropriate.
- Respect keyboard insets when a sheet contains text input.
- Do not stack multiple sheets on top of each other.
- For multi-step forms or complex settings, use a full screen instead.

---

## 14. Dialogs and confirmation patterns

Use dialogs for decisions requiring immediate attention or confirmation. Do not use a dialog for every simple action.

### 14.1 Suitable cases

- Confirm deleting a folder or bookmark.
- Confirm destructive import/replace behavior.
- Explain a backup limitation or unsupported file.
- Confirm removing or changing private-folder protection when data handling is affected.

### 14.2 Requirements

- Short, explicit title.
- One or two sentences explaining the consequence.
- Clear action labels; avoid vague labels such as "Yes" and "No".
- Destructive action uses the error role.
- Safe/cancel action is easy to identify.
- Never delete a folder's bookmarks without an explicit user choice.
- Do not use dialogs for routine success messages; use a snackbar or inline confirmation.
- Avoid nested dialogs.

### 14.3 Standard folder deletion options

When a folder is deleted, show the two supported outcomes:

1. Delete folder and move its bookmarks to Uncategorized (recommended safe action).
2. Delete folder and its bookmarks (destructive action requiring clear confirmation).

The copy in the dialog must make the consequences unambiguous.

---

## 15. Floating Action Button and Add flow

The Add action should be easy to reach without becoming another navigation destination.

- Use a Material-style FAB or expressive FAB where supported by the chosen component strategy.
- Place it above the floating navigation bar and safe-area inset so neither overlaps.
- Use a clear plus/add-link icon and accessible label such as "Save a link".
- Tap opens the manual Save Link flow.
- Receiving a shared URL from another app opens the same Save Link flow with the URL prefilled.
- Do not create separate save pipelines for share-intent and manual entry; both should use the same form, validation, and persistence logic.

---

## 16. Reusable component inventory

Create these shared components only when they are used in more than one place or provide a meaningful shared behavior. Keep feature-specific components inside their feature folder.

| Component | Responsibility | Notes |
|---|---|---|
| `AppScreen` / `ScreenContainer` | Common safe-area and screen layout | Avoid duplicating padding/background logic |
| `FloatingNavigationBar` | Home, Folders, Settings destinations | One source of truth for selected state |
| `FloatingAddButton` | Opens Save Link flow | Must sit clear of navigation bar |
| `TopAppBar` | Standard title/back/actions row | Use only the variants actually needed |
| `BookmarkPreviewCard` | Shared bookmark card composition | Prefer a single component with explicit `variant` over many near-duplicates |
| `BookmarkPreviewImage` | Cached image, loading and fallback states | Keep image loading logic reusable |
| `BookmarkFallbackArtwork` | Designed fallback when metadata/image is absent | Never show a blank image region |
| `FolderCard` | Folder identity, count and privacy indicator | No private content preview |
| `SearchField` | Consistent local-search entry | Search remains a secondary route/action |
| `TextField` | Common input styling and states | Do not wrap every third-party/native input without value |
| `PrimaryButton` / button variants | Consistent button styling | Prefer a small number of variants |
| `IconButton` | Compact accessible icon action | Always provide accessibility label |
| `FilterChip` | Simple filters/sort selections | Only add when filtering is in scope |
| `FolderPickerSheet` | Choose/create destination folder | Reuse for save and move flows |
| `BookmarkActionsSheet` | Bookmark overflow actions | Keep action order consistent |
| `ConfirmationDialog` | Standard destructive confirmation | Clear consequence and action labels |
| `EmptyState` | First-use and empty collection guidance | One title, short explanation, one useful action |
| `LoadingState` | Loading feedback | Avoid unnecessary full-screen spinners |
| `ErrorState` | Recoverable error feedback | Provide a next action when possible |
| `OfflineNotice` | Explains unavailable network-dependent work | Do not block local browsing |
| `SnackbarHost` / feedback | Short operation confirmation | Avoid success dialogs |
| `PrivateFolderIndicator` | Communicates locked/private state | Never reveal private bookmark metadata |

### 16.1 Component API guidance

- Prefer simple, explicit props and well-defined variants.
- Keep domain logic out of visual components.
- Components should receive data and callbacks; they should not execute SQL, fetch metadata, or perform encryption themselves.
- Do not build a generic component with dozens of boolean props.
- Avoid a separate component for every one-off container, spacer, or text label.
- Keep screen-specific compositions in their feature directory.

---

## 17. Motion and interaction feedback

Motion should make state changes understandable, not slow users down.

| Interaction | Guidance |
|---|---|
| Navigation selection | Short indicator/state transition |
| Open folder | Subtle transition; preserve expected Android navigation behavior |
| Save bookmark | Immediate success feedback after persistence succeeds |
| Preview image loading | Optional restrained placeholder/shimmer; never block saving |
| Open bottom sheet | Standard Material motion with smooth entrance/exit |
| Delete item | Confirm first when destructive; update after database success |
| Unlock private folder | Use system authentication UI; avoid custom imitation fingerprint animation |

General rules:
- Keep most micro-interactions brief (roughly 100–250 ms as a starting point).
- Use consistent easing; do not use spring/bounce effects for routine actions unless supported by the chosen Material component and used purposefully.
- Respect reduced-motion preferences.
- Do not animate large numbers of bookmark cards simultaneously.
- Avoid motion that delays access to saved content.

---

## 18. Screen-level consistency rules

These rules apply across the application:

- Home contains recent folders plus a four-item recently saved preview with a View all action; it has no See All action for folders and no search field.
- Folders is the complete folder-browsing destination.
- Search is accessed from Folders, not from the floating navigation bar.
- Settings contains theme, privacy/security, and backup/import-export options.
- Every bookmark is shown with a rich preview or a designed fallback card.
- Private folders never expose bookmark titles, URLs, notes, or thumbnails while locked.
- A folder's color/icon is user-facing identity, not a status system.
- All top-level screens use the same floating navigation bar.
- Secondary screens use a consistent top app bar/back pattern.
- Save and move flows share the same folder picker behavior.
- Empty states always explain what the user can do next.

---

## 19. Accessibility requirements

- Target at least 48 × 48 dp for interactive touch targets wherever practical.
- Provide meaningful TalkBack labels for icon-only actions.
- Use semantic roles and state announcements for selected navigation, locked folders, loading, and errors.
- Meet WCAG AA contrast targets for text and important controls.
- Support large font scaling without clipping or overlapping controls.
- Preserve logical reading and focus order.
- Do not rely on color alone for selected, private, warning, success, or error states.
- Do not expose private bookmark information through accessibility labels while locked.
- Respect system reduced-motion settings.
- Verify both light and dark themes with contrast tools and physical Android devices.

---

## 20. Implementation rules for the coding agent

1. Read this document and `UI_UX_SPECIFICATION.md` before implementing visual components.
2. Inspect the existing project and reuse its established setup where reasonable; do not recreate the application unnecessarily.
3. Build a centralized, typed theme/token layer. Never scatter repeated color, spacing, shape, or typography literals across screens.
4. Use semantic color tokens in components. Avoid direct hex values outside the theme definitions and intentionally data-driven preview artwork.
5. Build the floating navigation bar once and reuse it across top-level destinations.
6. Keep Home, Folders, and Settings as the only primary navigation destinations. Search is secondary and is reached from Folders.
7. Do not add a See All action or recent bookmark section to Home.
8. Create a reusable bookmark preview card with grid/list variants and robust fallback artwork.
9. Keep UI components presentational. Database, network, security, and backup logic belong in the appropriate feature/service/repository layers.
10. Do not create abstractions or dependencies without a concrete reuse or correctness benefit.
11. Validate contrast, font scaling, TalkBack labels, and touch targets as part of implementation.
12. Test all shared components in both light and dark themes.
13. When a token or shared component needs to change, update this document and the relevant UI specification rather than adding a local workaround.

### Definition of done

The design system is implemented when the app has a consistent Paperclip theme, a floating Home / Folders / Settings navigation bar, reusable bookmark and folder cards, consistent controls and sheets, complete light/dark behavior, and accessible states. The Home screen shows only recent folders, while the Folders destination provides full folder browsing and access to search.

---

## 21. Design references

- Paperclip Figma screens: https://www.figma.com/design/2XBBMl0bawDPNQcWXKUz9P
- Material 3 in Compose / Material 3 Expressive design guidance: https://developer.android.com/develop/ui/compose/designsystems/material3
- Material 3 color roles: https://m3.material.io/styles/color/overview
- Material 3 typography: https://m3.material.io/styles/typography/overview
- Material 3 shape: https://m3.material.io/styles/shape/overview
- React Native Paper documentation (Material Design 3 baseline; not a guarantee of full Expressive parity): https://oss.callstack.com/react-native-paper/

Re-check current Android and React Native library capabilities when implementation begins. Do not assume that a library supports every Material 3 Expressive feature solely because it advertises Material 3 support.
