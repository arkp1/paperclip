# Paperclip — UI/UX Specification

**Product:** Paperclip  
**Platform:** Android  
**Document version:** 1.0  
**Status:** MVP interface specification  
**Design system:** Material 3 Expressive direction  
**Related documents:** `Paperclip_PRD.md`, `Paperclip_TRD.md`, `USER_FLOWS.md`  
**Design reference:** [Paperclip Figma file](https://www.figma.com/design/2XBBMl0bawDPNQcWXKUz9P)

---

## 1. Purpose

This document specifies the visual hierarchy, navigation, screen composition, reusable components, interaction states, and accessibility behavior for Paperclip.

The design must feel modern, calm, tactile, and visually rich without becoming decorative or complicated. Bookmark previews are a core part of the experience: every saved link must appear as a polished preview card or a deliberate fallback card.

The Figma file is a visual exploration. Rebuild it with real React Native components; do not use exported screen screenshots as backgrounds.

## 2. Experience principles

1. **Folders first:** Home is intentionally focused on recently accessed folders.
2. **Visual bookmarking:** users should recognize saved links from their preview cards rather than reading raw URLs.
3. **Low friction:** save, open, move, and search actions should be easy to find.
4. **Progressive disclosure:** secondary actions live in menus, sheets, and detail views.
5. **Local-first reassurance:** saved information remains accessible offline and is stored on-device.
6. **Privacy clarity:** locked folders are clearly marked, but their content must not leak into public screens.
7. **Material 3 Expressive:** use expressive shapes, semantic color, typography, state layers, and purposeful motion consistently.

## 3. Design system direction

### 3.1 Material 3 Expressive

Use Material 3 Expressive as the design direction, not merely a set of rounded cards. Apply:

- Semantic color roles rather than arbitrary screen-specific colors.
- Expressive but controlled typography hierarchy.
- A deliberate shape scale with variation by component role.
- Tonal surfaces and restrained elevation.
- Clear pressed, selected, focused, disabled, loading, and error states.
- Purposeful transitions and motion that respect reduced-motion settings.
- Accessible touch targets and readable contrast.

The app is built with React Native. Native Material 3 Expressive controls may be used where a compatible package is proven to work with the project's Expo/React Native setup. Product-specific cards and layouts should remain ordinary reusable React Native components. Do not mix multiple UI libraries or create a large design-system abstraction layer.

### 3.2 Brand direction

Use the existing Figma exploration as the starting point:

- Warm off-white / cream surfaces.
- Lavender or muted purple as the primary accent.
- Restrained sage, peach, sky, and butter accents for folder differentiation.
- Deep charcoal text in light mode.
- Warm charcoal/plum surfaces in dark mode.
- Avoid neon colors, excessive gradients, and heavy shadows.

Exact colors should be centralized as semantic tokens and adjusted for contrast. Folder colors should not be the only way to distinguish folder types or states.

### 3.3 Theme support

Provide:

- System theme.
- Light theme.
- Dark theme.
- Android dynamic color where it is supported and can be integrated reliably.
- A Paperclip fallback palette when dynamic color is unavailable or disabled.

Store the selected theme preference locally. Do not duplicate the same preference in multiple state stores.

## 4. Navigation and global layout

### 4.1 Floating bottom navigation

The floating bottom navigation bar contains exactly three destinations:

| Destination | Purpose | Icon direction |
|---|---|---|
| Home | Recently accessed folders | Home icon |
| Folders | Full folder library and saved collections | Folder icon |
| Settings | App preferences, privacy, backups | Settings icon |

Search is not a navigation item. It is opened from the Folders screen.

### 4.2 Floating bar appearance

- Use a floating pill/capsule container centered horizontally above the Android bottom safe area.
- Keep a visible gap between the bar and the physical/system navigation edge.
- Use a tonal surface distinct from the page background, with a subtle elevation or outline.
- Selected destination uses a clear expressive active indicator (for example, a tonal pill behind the icon and label).
- Unselected destinations use a quieter on-surface-variant treatment.
- Use icon + text labels so navigation is understandable without relying on icon recognition alone.
- Keep the bar compact enough to leave room for screen content.
- The navigation container must not overlap a list item, button, or text field. Add matching bottom content inset/padding to scrollable screens.
- Respect gesture navigation, three-button navigation, display cutouts, and window insets.
- Avoid drawing the bar inside a modal flow where it would compete with the task.

### 4.3 Visibility rules

Show the floating bar on the root Home, Folders, and Settings screens. Hide it on:

- Save Link.
- Search.
- Folder Details if it is a pushed detail route and the content needs the space; otherwise keep it consistent with the chosen navigation structure.
- Private Folder Unlock.
- Backup import preview / password entry.
- Full-screen dialogs or focused forms.

Choose one consistent rule for Folder Details. The recommended behavior is to hide the floating bar on pushed detail routes and show it only on the three primary tabs.

### 4.4 Screen shell

Create one small shared screen shell that handles:

- Safe-area and edge-to-edge insets.
- Background color.
- Scrollable content padding.
- Floating navigation placement on primary tabs.
- Keyboard interaction where applicable.

Do not build a generic page-builder framework. Use the shared shell only for genuinely repeated layout behavior.

## 5. Home screen

### 5.1 Purpose

Home is a quick-return surface for recently opened folders and a small preview of recently saved links. It should stay quiet and uncluttered.

### 5.2 Required content

- Paperclip app identity / title.
- A **Recent folders** heading.
- Recent folder cards.
- A **Recently saved** heading with up to four public bookmark cards and a **View all** action (product-owner decision, 3 November 2026).
- Floating bottom navigation.
- A minimal add-link action may be available in the top app bar, provided it does not add a full bookmark feed to Home.

### 5.3 Explicit exclusions

Home must NOT contain:

- A bookmark feed longer than the four-item “Recently saved” preview.
- A See All action for the folder collection.
- A search field or search destination.
- A duplicate full folder directory.

Home combines recent folders with a small recently saved preview. The full collection belongs on Folders.

### 5.4 Recent folder card

Each card should show:

- Folder name.
- Folder icon or simple folder glyph.
- Optional color token/background.
- Bookmark count, only where it does not expose sensitive private information.
- Lock indicator for private folders.

Interaction:

- Tap opens Folder Details or the unlock flow for a private folder.
- Long press is not required for MVP.
- Overflow actions may be provided if they do not clutter the card; otherwise manage folders from the Folders screen.

### 5.5 Layout behavior

- Use a two-column grid on typical phone widths where card labels remain readable.
- Collapse to one column on narrow screens or large font settings where two columns would truncate the name.
- Use consistent card dimensions and spacing.
- Home displays up to the configured recent-folder limit (recommended six).
- Home displays up to four recently saved bookmarks in a two-column grid; “View all” opens All bookmarks.
- No See All affordance should appear for folders, even when there are more than six folders; users go to the Folders tab to browse the complete collection.

### 5.6 Empty state

Copy direction:

**No recent folders yet**  
Open a folder from Folders and it will appear here for quick access.

No See All button. A secondary action may open the Folders tab if needed.

## 6. Folders screen

### 6.1 Purpose

Folders is the main library directory and the place to find the complete saved collection.

### 6.2 Required content

- Top app bar: **Folders**.
- Search icon/button in the app bar.
- Create-folder action.
- All Bookmarks smart collection.
- Uncategorized smart collection when applicable.
- User-created folder cards/list.
- Floating bottom navigation.

### 6.3 Smart collections

- **All Bookmarks:** opens a visual list/grid of all non-private bookmarks. It is not stored as a physical folder.
- **Uncategorized:** opens bookmarks whose folder reference is null.
- These should be visually distinguishable from user-created folders, while still fitting the Paperclip design language.

### 6.4 Search entry point

- Search icon/button in the Folders app bar.
- Opens a dedicated Search screen.
- Search is not a tab and must not appear in the floating navigation bar.
- Search results use the same reusable bookmark preview card components as folder views.

### 6.5 Empty states

- No folders: explain that folders help organize saved links, with a Create Folder action.
- No bookmarks: explain that links can be shared to Paperclip or pasted manually.
- No Uncategorized items: hide or show an empty count according to a consistent rule.

## 7. Folder Details screen

### Required content

- Back navigation.
- Folder icon/color and name.
- Bookmark count.
- Search-this-folder action.
- Optional sort/filter controls.
- Bookmark preview cards.
- Folder overflow menu: rename, make private/unprivate, delete.

### Bookmark layout

Use a grid of visual cards for browsing when the screen width supports it. For compact screens, dense results, or search, use a horizontal list card. Avoid implementing multiple layout modes until there is a clear user need.

### Empty state

Show a folder-specific empty state that encourages saving a link into this folder. Do not show generic placeholder bookmark cards.

## 8. Bookmark preview cards

### 8.1 Core requirement

Every saved bookmark must render as a rich preview card or a designed fallback card. A raw URL-only row is not an acceptable primary visual treatment.

### 8.2 Card variants

Build one reusable component with a small number of explicit variants:

1. **Grid card:** prominent cover image, title, source/domain.
2. **List card:** compact thumbnail, title, description/source, secondary context.
3. **Fallback card:** designed artwork/tonal treatment when image metadata is unavailable.
4. **Loading card:** preview retrieval is in progress.

Do not create separate unrelated components for Instagram, YouTube, articles, recipes, and websites. Use source labels and preview data to configure the same component.

### 8.3 Content hierarchy

Recommended order:

1. Preview image or fallback artwork.
2. Title.
3. Domain/source label.
4. Optional short description.
5. Optional folder/date metadata where useful.

Do not let long URLs dominate the card. Full URL is available in details/actions.

### 8.4 Image treatment

- Use a consistent image ratio per card variant (recommended landscape 16:9 for the cover area).
- Clip image corners to the card's shape.
- Use a neutral/tonal placeholder while loading.
- Never show a broken-image glyph or empty white image box.
- Use local cached image files when available.
- Respect image memory/performance constraints in long lists.
- Add meaningful image accessibility text only when the image conveys useful content; decorative fallback artwork should be hidden from screen readers.

### 8.5 Fallback hierarchy

1. Image + title + description + source.
2. Image + title + source.
3. Favicon/source icon + title/domain with a tonal background.
4. Generated Paperclip fallback artwork + hostname/title.

Fallback cards should still feel designed and consistent with Material 3 Expressive.

### 8.6 Card interactions

- Main surface tap opens the original URL.
- Overflow menu actions: Edit, Move, Copy URL, Share, Refresh Preview, Delete.
- Ensure overflow tap does not trigger the card's open action.
- Provide pressed and focus states.
- Avoid gestures that conflict with normal scrolling.

## 9. Save Link screen

### Purpose

Present the incoming or pasted link, let the user confirm/edit its preview information, choose a folder, and save it.

### Layout

- Close/back action.
- Screen title: Save Link.
- URL field or received URL summary.
- Large preview card with loading/partial/fallback states.
- Editable title field.
- Optional note field.
- Folder selector; default Uncategorized.
- Primary Save action.

### Behavior

- Save action remains available if preview extraction fails.
- The preview card updates when metadata becomes available.
- The user's edited title is not overwritten by a later metadata update.
- Avoid showing multiple loading indicators for the same fetch.
- Show validation feedback near the URL field.
- After successful save, show a concise confirmation and return to the appropriate prior context.

## 10. Search screen

### Entry

Opened from the Search icon on Folders.

### Layout

- Back action returning to Folders or the originating folder.
- Search field with clear action.
- Optional recent public searches; do not persist private queries.
- Results count/empty state.
- Visual bookmark preview cards.

### Behavior

- Search title, URL/domain, description, note, and folder name.
- Debounce input modestly (for example, 150–250 ms) if profiling shows it is useful.
- No network requests for ordinary search.
- Locked private content must not appear.
- Clear results and private query state when a private session locks.

## 11. Private Folder Unlock

### Layout

- Folder identity without revealing bookmark titles/previews.
- Clear privacy message.
- Biometric/device-credential action.
- Cancel/back action.
- Fallback guidance if authentication is unavailable.

### Behavior

- Do not fake a biometric interface with a React Native modal. Invoke the native authentication API.
- Do not unlock based on a UI state alone if the data key or protected storage has not been released successfully.
- On success, navigate into the folder and show private cards.
- On cancel/failure, keep private content hidden.
- Lock again on configured lifecycle events; redact app-switcher snapshot.

## 12. Settings screen

Group settings into simple sections:

### Appearance

- Theme: System / Light / Dark.
- Dynamic color toggle where supported.

### Privacy & Security

- Private-folder authentication status.
- Auto-lock duration.
- Clear explanation of local storage/privacy behavior.

### Your Data

- Import & Export.
- Backup status/help text.

### About

- App version.
- Privacy statement / credits where needed.

Do not add account, subscription, cloud sync, or notification options in the MVP.

## 13. Import / Export screens

### Export

- Explain public-only versus encrypted full backup.
- Clearly identify whether private folders are included.
- Require backup password/secure method for private data.
- Show progress and final success/failure state.

### Import

- File selection.
- Validation state.
- Password entry for encrypted backups.
- Import summary.
- Duplicate handling choice.
- Explicit confirmation before applying changes.
- Final imported/skipped/failed counts.

Never make a destructive import the default.

## 14. Components to implement

Keep this list practical. Reuse a component when the same interaction or visual pattern occurs more than once.

| Component | Responsibility |
|---|---|
| `FloatingNavigationBar` | Home, Folders, Settings navigation on primary routes. |
| `ScreenContainer` | Shared safe-area, background, and scroll/content inset behavior. |
| `FolderCard` | Folder identity, count/lock state, open action. |
| `SmartCollectionCard` | All Bookmarks and Uncategorized entry cards. |
| `BookmarkCard` | Grid/list/fallback/loading preview presentation. |
| `BookmarkPreviewImage` | Load local preview image and show placeholder/fallback. |
| `BookmarkFallbackArtwork` | Deterministic fallback for unavailable image metadata. |
| `SearchField` | Search input with clear action. |
| `FolderPicker` | Choose a destination folder. |
| `EmptyState` | Consistent empty-state presentation. |
| `ErrorState` | Recoverable error and retry action. |
| `ConfirmationDialog` | Confirm destructive or irreversible actions. |
| `ActionSheet` / bottom sheet wrapper | Secondary actions and pickers. |
| `LoadingIndicator` | Consistent asynchronous feedback. |

Do not build a generic component framework or a wrapper for every native element. Keep simple one-use layout elements local to their feature screen.

## 15. Typography, spacing, shapes, and elevation

### Typography

Use a consistent Material 3 type scale. Map text to semantic roles such as display/headline/title/body/label rather than assigning arbitrary font sizes in each screen.

- Screen titles: headline/title role.
- Section headings: title role.
- Folder names and bookmark titles: title/body role depending on size.
- Metadata/domain labels: body-small/label role.
- Button and navigation labels: label role.

Support system font scaling. Titles must wrap or truncate gracefully without hiding critical actions.

### Spacing

Use a consistent 4 dp base scale. Common spacing values can include 4, 8, 12, 16, 20, 24, and 32 dp. Define these once as tokens; avoid one-off numbers throughout the app.

### Shapes

Use a defined shape scale with expressive but consistent variation:

- Small controls/chips: pill or small rounded corners.
- Text fields: medium rounded corners.
- Folder cards: large rounded corners.
- Bookmark cards: large rounded corners.
- Floating navigation: capsule shape.

Do not use unrelated corner radii on every component.

### Elevation

Prefer tonal surface differences and subtle elevation. Avoid heavy drop shadows, especially on every card. The floating navigation may use a little more elevation than content cards so it reads as a separate layer.

## 16. Motion and feedback

- Use motion to communicate state changes, not as decoration.
- Keep transitions short and subtle.
- Animate navigation selection, bottom-sheet entry, and small state transitions where supported.
- Avoid animating every card on scroll or every image load.
- Respect Android reduced-motion/accessibility settings.
- Use snackbars or concise inline feedback for successful save, move, copy, and delete actions.
- Do not use a toast as the only feedback for important or destructive actions.

## 17. Accessibility and responsive behavior

- Interactive targets should generally be at least 48 dp high/wide where practical.
- All icon-only buttons need accessibility labels and hints.
- Support TalkBack with logical reading and focus order.
- Maintain accessible contrast in light and dark modes.
- Do not use color alone to convey private/locked/selected/error state.
- Support large font sizes and Android display scaling.
- Ensure keyboard does not cover the Save action or search results.
- Ensure the floating navigation bar respects safe areas and does not overlap scroll content.
- Test compact Android phones, larger devices, gesture navigation, and three-button navigation.

## 18. Loading, empty, and error states

Design a specific state for:

- First launch with no folders.
- Home with no recent folders.
- Folders with no user folders.
- Empty All Bookmarks.
- Empty Uncategorized.
- Empty folder.
- Search with no query.
- Search with no results.
- Bookmark preview loading.
- Bookmark preview unavailable.
- Offline while saving.
- Import validation failure.
- Export failure.
- Authentication canceled/failed/unavailable.
- Database/storage error.

A preview failure must never prevent a saved bookmark from showing a fallback card.

## 19. UI acceptance checklist

- [ ] Floating navigation is visibly separated from the screen bottom and system navigation.
- [ ] Navigation contains Home, Folders, Settings only.
- [ ] Search is accessed from Folders and not shown as a tab.
- [ ] Home contains recent folders plus a four-item Recently saved preview.
- [ ] Home has no See All action for folders and no search field.
- [ ] Folders provides access to the complete folder library and smart collections.
- [ ] Folder cards clearly communicate name and lock state.
- [ ] Every bookmark uses a rich visual card or designed fallback.
- [ ] Grid/list card variants remain visually consistent.
- [ ] Save Link works for shared and manually entered URLs.
- [ ] Private content is absent from public screens and app-switcher snapshots while locked.
- [ ] Light, dark, and supported dynamic color modes are legible.
- [ ] Touch targets, TalkBack labels, text scaling, and keyboard behavior are tested.
