# Paperclip --- Product Requirements Document

**Product:** Paperclip\
**Product type:** Android application --- personal link and article
saver\
**Document version:** 1.2\
**Status:** MVP specification\
**Last updated:** 2 November 2026\
**Primary platform:** Android\
**Product principle:** Save now. Organize later. Find it when you need
it.

------------------------------------------------------------------------

## 1. Product summary

Paperclip is an offline-first Android app for saving links discovered
across Instagram, YouTube, Reddit, browsers, and other apps. It gives
users one visually rich personal library where they can organize saved
links into folders, protect selected folders, search their collection,
and back up or restore their data.

Every saved link must be represented by a **visual preview card**, not
merely a raw URL in a plain list. The app should attempt to retrieve
useful page metadata and a preview image. If a source blocks metadata
extraction or does not provide an image, Paperclip must still render a
polished fallback card using the available title, domain, favicon, and a
designed placeholder.

Paperclip is local-first: no account, sign-in, or cloud service is
required for the MVP. The original content remains hosted by its source
platform; Paperclip saves the URL and locally stored metadata/preview
assets, not a copy of the original Instagram post, video, or article.

### 1.1 Vision

Make saving and revisiting useful internet content feel effortless,
beautiful, private, and dependable.

### 1.2 Product goals

1.  Save a link from another Android app in a few taps.
2.  Give every saved link an attractive, consistent visual preview.
3.  Make folders easy to create, browse, and manage.
4.  Keep selected collections private and securely protected.
5.  Make the complete library searchable offline.
6.  Give users ownership of their data through local storage and
    portable backups.
7.  Deliver a polished Android experience using the latest stable
    Material 3 design system, including Material 3 Expressive where
    supported by stable APIs.

### 1.3 Non-goals for the MVP

-   User accounts or mandatory sign-in.
-   Cloud sync or a hosted backend.
-   Downloading or rehosting Instagram/YouTube media.
-   AI summaries, recommendations, or semantic search.
-   Social feeds, collaboration, or sharing folders with other users.
-   A full in-app web browser or complete offline article reader.
-   Browser extensions or iOS support.

------------------------------------------------------------------------

## 2. Target users and use cases

### 2.1 Target users

-   People who regularly save Instagram posts, reels, and links.
-   Students collecting tutorials, documentation, and study resources.
-   Readers saving articles to revisit.
-   Creators collecting references and inspiration.
-   Anyone who wants a private, local alternative to cloud-based
    bookmark managers.

### 2.2 Primary user stories

-   As a user, I can share a link from Instagram or another app to
    Paperclip so I can save it without copying and pasting.
-   As a user, I can see a visual preview of every saved link so I can
    recognize it later.
-   As a user, I can create folders and move bookmarks between them so
    my library stays organized.
-   As a user, I can lock a folder so other people using my device
    cannot casually view its contents.
-   As a user, I can search titles, URLs, descriptions, notes, and
    folder names so I can find something quickly.
-   As a user, I can export my library and import it later so I control
    and can restore my data.
-   As a user, I can use the core library without an internet
    connection.

------------------------------------------------------------------------

## 3. Product principles

1.  **Fast capture:** saving a link should take as few steps as
    possible.
2.  **Visual first:** bookmark cards should be recognizable at a glance.
3.  **Graceful degradation:** a missing preview image must never prevent
    a link from being saved.
4.  **Local ownership:** the local database is the source of truth.
5.  **Privacy by design:** private-folder data must be protected beyond
    simply hiding it in the UI.
6.  **Progressive complexity:** common actions are obvious; advanced
    actions stay out of the way.
7.  **Native Android quality:** use platform conventions, accessible
    components, responsive layouts, and system behaviors.

------------------------------------------------------------------------

## 4. Scope and prioritization

Priority definitions:

-   **P0 --- Must have:** required for the first usable release.
-   **P1 --- Should have:** important, but can follow the initial core
    implementation.
-   **P2 --- Later:** enhancement after the MVP is stable.

  Feature                                               Priority
  ----------------------------------------------- --------------
  Receive shared URLs from Android Sharesheet                 P0
  Save links and essential metadata locally                   P0
  Visual preview card for every saved link                    P0
  Create, rename, delete, and browse folders                  P0
  Move bookmarks between folders                              P0
  All Bookmarks and Uncategorized views                       P0
  Search bookmarks                                            P0
  Offline access to saved bookmark data                       P0
  JSON export and import                                      P0
  Private/locked folders with encrypted content               P0
  Biometric authentication and PIN fallback                   P0
  Dark theme and Android dynamic color                        P0
  Bulk actions                                                P1
  CSV export                                                  P1
  Advanced sorting and filtering                              P1
  Custom folder colors/icons                                  P1
  Multiple preview layout styles                              P2
  Cloud sync                                        Out of scope
  AI features                                       Out of scope

------------------------------------------------------------------------

## 5. Functional requirements

### 5.1 Save links through Android sharing

**Priority: P0**

Paperclip must be available as a target in Android's system Sharesheet
when another app shares a URL or text containing a URL.

#### Requirements

-   Support Android `ACTION_SEND` with `text/plain`.
-   Accept a direct URL and extract a URL from shared text when
    possible.
-   Handle common URL forms, query parameters, and redirects safely.
-   Show a save screen containing the detected URL and its preview.
-   Allow the user to edit the title.
-   Allow the user to add an optional note.
-   Allow the user to choose an existing folder or create a new one.
-   Allow saving to Uncategorized.
-   Save the URL even if metadata extraction fails or the device is
    offline.
-   Show a clear success state after saving.
-   Detect likely duplicates and let the user open the existing bookmark
    or save another copy if appropriate.
-   Do not silently discard a URL because a preview request failed.

#### Save flow

1.  User opens content in Instagram, YouTube, Reddit, Chrome, or another
    app.
2.  User taps Share.
3.  User chooses Paperclip.
4.  Paperclip receives and validates the shared text/URL.
5.  Paperclip creates a provisional bookmark and starts metadata
    retrieval.
6.  Save UI displays the preview as soon as available, with a loading or
    fallback state in the meantime.
7.  User optionally edits title/note and selects a folder.
8.  User saves.
9.  Bookmark is persisted locally. Preview retrieval may continue if it
    has not completed.

#### Manual add

The app should also provide an Add Link action inside Paperclip. Users
can paste a URL manually, preview it, edit metadata, select a folder,
and save.

### 5.2 Visual link previews

**Priority: P0 --- Core product requirement**

Every saved bookmark must be displayed as a visual preview card. A plain
URL-only row is not an acceptable primary presentation.

#### Preview card content

Display as many of the following as are available:

-   Preview/cover image.
-   Page or post title.
-   Short description.
-   Website name or source platform.
-   Domain.
-   Favicon or source icon.
-   Date saved (where useful in the selected layout).
-   Folder association (where useful in the selected layout).

#### Metadata extraction order

When a link is saved, attempt to retrieve metadata in this order:

1.  Open Graph metadata:
    -   `og:title`
    -   `og:description`
    -   `og:image`
    -   `og:site_name`
    -   `og:url`
2.  Twitter/X card metadata:
    -   `twitter:title`
    -   `twitter:description`
    -   `twitter:image`
    -   `twitter:card`
3.  Standard HTML metadata:
    -   `<title>`
    -   `<meta name="description">`
    -   favicon links
4.  URL-derived fallback:
    -   hostname/domain
    -   normalized URL
    -   known source/platform label when reliably detectable

Use metadata from the final destination after redirects when safe.
Preserve the user's original submitted URL separately from any canonical
URL discovered in page metadata.

#### Preview image behavior

-   Fetch the best usable preview image from metadata.
-   Prefer a sufficiently large image with a valid supported image
    content type.
-   Download and cache the preview image locally so it remains visible
    offline.
-   Keep image files in app-managed storage and associate them with the
    bookmark.
-   Use a maintained React Native image-loading library for
    rendering and caching.
-   Display an appropriate placeholder while the image loads.
-   Handle broken, inaccessible, oversized, or unsupported images
    without crashing.
-   Do not hotlink remote images indefinitely as the only preview
    mechanism.
-   Do not download or store the original media from Instagram, YouTube,
    or other social platforms unless explicitly permitted by the
    platform and a future product requirement.

#### Required fallback hierarchy

A preview card must exist even when no image or metadata is available.

1.  **Rich preview:** image + title + description + source/domain.
2.  **Image + title:** image and title, with domain/source.
3.  **Brand/source preview:** source icon or favicon, title/domain, and
    a branded or neutral visual background.
4.  **Generated fallback:** a designed gradient/tonal surface, source
    icon or generic link icon, hostname, and the URL or user-entered
    title.

Fallback cards must use consistent dimensions, typography, spacing, and
visual hierarchy. Never show a broken-image icon or a blank image
region.

#### Preview layouts

Use a consistent card component that can support at least:

-   **Grid card:** prominent image/cover with title and source beneath;
    suitable for visual browsing.
-   **List card:** compact horizontal thumbnail with title,
    description/source, and secondary metadata; suitable for search
    results and dense lists.

The initial default may be a grid on the home/library screen and a list
in search results. Avoid adding a user-facing layout switch unless it is
straightforward and valuable.

#### Preview states

The UI must support:

-   Loading metadata.
-   Preview available.
-   Partial metadata.
-   Metadata unavailable.
-   Image download failed.
-   Offline at time of save.
-   Refreshing preview.
-   Preview stale or manually edited.

A preview failure must never block saving, opening, searching, moving,
or exporting a bookmark.

#### User editing

-   Users can edit the title and note.
-   A user-edited title must not be overwritten by later metadata
    refreshes.
-   Provide a way to retry/refresh preview metadata.
-   Make it clear when a preview is unavailable, without making the card
    look broken.

#### Metadata refresh

-   Do not repeatedly fetch metadata every time a screen renders.
-   Store fetch status and last attempted/successful fetch timestamps.
-   Refresh only on explicit user action or a controlled background
    policy.
-   Respect network availability and reasonable timeouts.
-   Avoid unnecessary background activity and battery use.

#### Security and privacy for metadata fetching

Metadata extraction must be implemented defensively:

-   Permit only `http` and `https` URLs; prefer HTTPS.
-   Reject local, loopback, link-local, private-network, and otherwise
    non-public IP destinations to mitigate SSRF.
-   Revalidate the destination after every redirect.
-   Limit redirect count, response size, connection timeout, and read
    timeout.
-   Do not execute page JavaScript.
-   Do not download arbitrary files as preview images.
-   Validate MIME type and image dimensions/size before caching.
-   Do not send saved URLs to a third-party metadata service by default.
-   Do not fetch metadata for private bookmarks without an explicit,
    user-initiated action if doing so could reveal the URL externally.
-   Handle authentication-required and paywalled pages as
    partial/unavailable previews.

#### Platform-specific limitations

Some social platforms, especially Instagram, may block automated
metadata requests or return incomplete metadata. The app must not
promise that every platform will provide a real image. The product
requirement is that **every bookmark always has a polished visual
card**, using extracted metadata when available and a graceful fallback
otherwise.

### 5.3 Folder management

**Priority: P0**

Users can organize bookmarks into folders.

#### Requirements

-   Create folders with a name.
-   Rename folders.
-   Delete folders.
-   Assign optional icon/emoji and optional color.
-   Display bookmark count.
-   Move one bookmark to another folder.
-   Support bulk selection and movement as a P1 enhancement.
-   Display All Bookmarks.
-   Display Uncategorized.
-   Allow a bookmark to belong to one folder at a time in the MVP.
-   Keep folder order stable and support a simple default sort.

#### Default organization

-   All Bookmarks --- virtual view; not a physical folder.
-   Uncategorized --- physical default destination for bookmarks without
    a selected folder.
-   User-created folders.

#### Delete behavior

When a folder is deleted, show a confirmation with two explicit choices:

1.  Delete the folder and move its bookmarks to Uncategorized.
2.  Delete the folder and its bookmarks.

The safer option (move bookmarks to Uncategorized) should be visually
emphasized as the recommended action. Never delete bookmarks without
clear confirmation.

### 5.4 Private / locked folders

**Priority: P0**

Users can mark a folder as private. Access requires authentication.

#### Requirements

-   Toggle a folder between normal and private.
-   Require authentication before showing private folder contents.
-   Support Android biometric authentication through the system biometric prompt, accessed through a compatible React Native native module.
-   Provide a secure PIN fallback and a recovery flow that does not
    expose plaintext secrets.
-   Lock the folder again when the user leaves it or after a
    configurable inactivity period.
-   Exclude locked-folder contents from normal library views and search
    results until unlocked.
-   Do not reveal private bookmark titles, URLs, thumbnails, or notes in
    notifications, widgets, app-switcher previews, or logs.
-   Protect private backup content as described in Import/Export.

#### Security requirements

-   A UI-only lock is insufficient.
-   Encrypt private bookmark data and sensitive metadata at rest.
-   Use Android Keystore to protect encryption keys.
-   Use authenticated encryption (for example, AES-GCM) with unique
    nonces/IVs.
-   Never store a PIN in plaintext or use the PIN directly as an
    encryption key.
-   Use a well-reviewed key derivation approach if PIN-based key
    protection is implemented.
-   Avoid logging decrypted content, keys, PINs, or sensitive URLs.
-   Define behavior for biometric enrollment changes and key
    invalidation.
-   Do not claim protection against a compromised/rooted device.

The implementation should document the threat model and key lifecycle
before coding the private-folder feature.

### 5.5 Local-first storage and offline behavior

**Priority: P0**

-   No account or sign-in is required.
-   SQLite is the source of truth for folders and bookmarks.
-   Store bookmark URLs, titles, descriptions, notes, folder references,
    timestamps, and preview state locally.
-   Cache preview images in app-managed local storage.
-   The library, folders, search, and saved metadata must work offline.
-   Opening the original URL requires network access and may require the
    source app or browser.
-   Metadata extraction should be optional and must not block saving.
-   Data must survive normal app restarts and process death.
-   Use database migrations for schema changes.
-   Clearly warn users that uninstalling/clearing app data may delete
    local bookmarks unless backed up.

### 5.6 Search

**Priority: P0**

Search should be available from the Folders screen through a top-app-bar search action. It is a secondary route, not a primary navigation destination.

#### Searchable fields

-   Bookmark title.
-   URL and hostname.
-   Description.
-   User note.
-   Folder name.

#### Requirements

-   Search locally; no network request required.
-   Update results as the user types, with a small debounce if needed.
-   Use case-insensitive matching.
-   Show visual preview cards in results.
-   Highlight or otherwise make the matching context understandable
    where practical.
-   Support search within a folder.
-   Exclude private folders until authenticated.
-   Provide clear empty, no-results, and cleared-search states.
-   Search should remain responsive for at least 10,000 bookmarks on a
    representative mid-range Android device.

### 5.7 Import and export

**Priority: P0**

Users must be able to back up and restore their library.

#### Export formats

-   **JSON:** complete Paperclip backup, including folders, bookmarks,
    notes, metadata, timestamps, and supported preview
    assets/references.
-   **CSV:** P1; flat bookmark export for spreadsheet compatibility.

Use Android's Storage Access Framework so users choose where to save or
load backup files. Do not require broad filesystem access.

#### JSON backup requirements

-   Include a schema version.
-   Include app identifier and export timestamp.
-   Preserve stable IDs or map IDs safely during import.
-   Preserve folder/bookmark relationships.
-   Include metadata and user notes.
-   Include preview image files in a documented archive format (for
    example, a ZIP containing a JSON manifest and image assets), or
    clearly document that previews will be regenerated after import if
    assets are not included.
-   Validate the file before changing the live database.
-   Import transactionally where practical; a failed import must not
    leave partially corrupted data.
-   Provide a preview/summary before import.
-   Handle duplicate URLs using a user-visible policy: skip duplicates,
    keep both, or update existing records.
-   Display imported, skipped, and failed counts.

#### Private folder backup requirements

Private content must never be silently exported in plaintext.

Recommended behavior: - Ask whether to include private folders. - If
included, require an encrypted backup protected by a user-provided
backup password or another explicitly designed secure mechanism. -
Clearly distinguish an encrypted full backup from a non-private
export. - Never include decrypted private thumbnails or notes in an
unencrypted archive.

#### Example manifest

``` json
{
  "app": "Paperclip",
  "schemaVersion": 1,
  "exportedAt": "2026-11-02T12:00:00Z",
  "folders": [
    {
      "id": "folder_001",
      "name": "Programming",
      "isPrivate": false
    }
  ],
  "bookmarks": [
    {
      "id": "bookmark_001",
      "url": "https://example.com/article",
      "canonicalUrl": "https://example.com/article",
      "title": "Example Article",
      "description": "A useful resource",
      "note": "Read this later",
      "folderId": "folder_001",
      "source": "example.com",
      "previewImagePath": "previews/bookmark_001.jpg",
      "createdAt": "2026-11-02T12:00:00Z",
      "updatedAt": "2026-11-02T12:00:00Z"
    }
  ]
}
```

This is illustrative. Final serialization and archive format must be
documented and versioned.

### 5.8 Bookmark actions

**Priority: P0**

Each bookmark card should offer:

-   Open original link.
-   Edit title/note.
-   Move to folder.
-   Copy URL.
-   Share URL.
-   Refresh preview.
-   Delete.

Opening a link should use Android's normal intent resolution so
Instagram links can open in Instagram when installed and websites can
open in the user's browser. Handle the case where no suitable app is
installed.

------------------------------------------------------------------------

## 6. UI/UX requirements

### 6.1 Design system: Material 3 Expressive

Use **Material 3 Expressive (M3 Expressive)** as the visual and interaction design direction for the Android application. Implement the interface in **React Native**, using native Android integrations or compatible React Native components where appropriate.

The PRD defines the intended product experience; the TRD defines the React Native implementation strategy and dependency choices. Do not use Material 2 styling or assume that a library described as Material 3 automatically implements the newer Expressive component patterns.

#### Design direction

- Modern, polished, warm, and visually calm.
- Expressive without being noisy or childish.
- Use semantic Material color roles and accessible contrast.
- Support light and dark themes.
- Support Android dynamic color where it can be obtained reliably, with a designed Paperclip fallback palette.
- Use expressive but purposeful shapes, generous touch targets, and restrained motion.
- Use a consistent typography scale, tonal surfaces, state layers, and elevation.
- Respect Android safe areas, system bars, edge-to-edge layouts, back navigation, and reduced-motion preferences.
- Use consistent components for navigation, search, dialogs, sheets, menus, chips, buttons, and floating actions.
- Avoid excessive gradients, random accent colors, and inconsistent corner radii.

#### React Native implementation guidance

- Build the application UI with React Native and TypeScript.
- Prefer maintained, stable libraries compatible with the repository's React Native / Expo versions.
- Native Material 3 Expressive integrations may be used for controls when their compatibility and accessibility have been verified.
- Product-specific elements such as bookmark preview cards, folder cards, and fallback artwork must remain reusable, editable React Native components.
- The floating bottom navigation must follow the design contract in Section 6.2; do not replace it with a full-width, edge-attached tab bar.
- The TRD is the implementation source of truth for the precise component strategy.

### 6.2 Main navigation

Paperclip has three primary destinations presented in a **floating bottom navigation bar**:

1. **Home** — shows only the user's recent folders.
2. **Folders** — opens the complete folder library and provides access to All Bookmarks, Uncategorized, and search.
3. **Settings** — appearance, privacy, backup, and app information.

Search remains a first-class feature, but it is **not** a bottom-navigation destination. Open the Search screen using the search action in the Folders screen's top app bar. Search results are a secondary route, not a fourth tab.

#### Floating navigation behavior and appearance

- Render the navigation as a floating, horizontally centered capsule/pill near the bottom of the screen.
- Keep visible separation from the screen edges and Android system navigation area; it must not be flush with the bottom edge.
- Use a tonal Material 3 surface, rounded expressive shape, restrained elevation, and a clear active-destination indicator.
- Provide exactly three destinations: Home, Folders, and Settings. Do not include Search or Add as navigation destinations.
- Meet Android touch-target and TalkBack requirements; each destination must have an accessible label and selected state.
- Reserve bottom content inset so scrolling content and the Add Link action cannot be obscured by the floating bar.
- The floating navigation is shown on the three primary destination screens. Hide it on focused flows and nested screens such as Save Link, Bookmark Details, Folder Details, Private Folder Unlock, and Search results unless the implementation can preserve clear hierarchy without making the navigation feel like a fourth-level control.

The Add Link action remains a separate floating action, not a navigation destination. Position it above the floating navigation with enough clearance to prevent overlap.

### 6.3 Home screen — Recent folders and recently saved

The Home screen is intentionally focused: **recent folders plus a small recently saved preview** (product-owner decision, 3 November 2026).

#### Required content

- Paperclip identity / a compact top app bar.
- A clear heading such as "Recent folders".
- A compact collection of the user's most recently opened folders, displayed as folder cards.
- A "Recently saved" section with up to four public bookmark cards and a "View all" action.
- The separate Add Link floating action, if present in the approved screen layout.
- The floating bottom navigation.

#### Explicit exclusions

- Do not show a bookmark feed longer than the four-item recently saved preview.
- Do not show a "See All" action for folders on Home.
- Do not show a search field or search-results list on Home.
- Do not duplicate the complete folder catalogue on Home.

The complete folder collection is available through the **Folders** navigation destination.

#### Recent folder ordering

- Show up to six recent folders by default; the layout may use fewer when the device width or accessibility font scale requires it.
- Rank folders by most recently opened (`lastOpenedAt`), newest first.
- For folders that have never been opened, use most recently created/updated as the fallback ordering.
- Opening a folder updates its `lastOpenedAt` value.
- Locked folders may appear as folder entries with a lock indicator, but their bookmark titles, notes, URLs, and preview images must never appear on Home.

#### Empty state

When the user has no folders, show a focused empty state explaining that folders help organize saved links and provide a Create Folder action. When no links have been saved, the Recently saved preview shows a short empty line; it does not substitute for the folder empty state.

### 6.3.1 Folders screen

The Folders destination is the user's complete folder library.

- Show all user-created folders, including locked folders as protected entries.
- Provide clear entry points for All Bookmarks and Uncategorized.
- Provide a search icon/action in the top app bar that opens the full Search screen.
- Support folder creation, editing, deletion, and opening.
- Folder cards show the folder name, optional icon/color, bookmark count, and privacy indicator.
- Do not expose the contents of locked folders until authentication succeeds.
- Use a clear empty state and Create Folder action when no folders exist.

### 6.4 Bookmark preview card component

Create one reusable, well-tested component for bookmark previews.

Required design variants: - Grid/large card for visual browsing. -
Compact list card for search and dense results. - Loading and fallback
variants.

Card hierarchy: 1. Image or designed fallback area. 2. Title, limited to
a sensible number of lines. 3. Source/domain and optional description.
4. Optional secondary metadata such as folder/date.

Requirements: - Consistent image aspect ratio and clipping. -
Predictable card heights within a grid. - Text truncation without losing
access to the full title on the detail/edit screen. - Accessible content
descriptions for images and actions. - Clear pressed, focused, selected,
and disabled states. - Avoid displaying a raw long URL as the dominant
card content. - Provide an overflow menu without making the whole card
difficult to tap. - Tapping the main card opens the original link;
actions remain independently accessible.

### 6.5 Suggested screens

| Screen | Purpose |
|---|---|
| Home | Recent folders only; no bookmark cards and no See All action |
| Folders | Complete folder library, All Bookmarks, Uncategorized, and Search entry point |
| Folder Details | Browse bookmarks in a selected folder |
| Search | Search the library with rich preview cards; opened from Folders |
| All Bookmarks | Browse all non-private bookmarks |
| Save Link | Preview, edit, and save a shared/pasted URL |
| Bookmark Details | View full metadata, note, and actions |
| Private Folder Unlock | Authenticate before opening private content |
| Settings | Theme, security, and preferences |
| Import / Export | Create and restore backups |

### 6.6 Empty, loading, and error states

Every major screen must have designed states for: - First launch / no
bookmarks. - No folders yet. - Empty folder. - No search results. -
Loading previews. - Offline metadata fetch. - Metadata unavailable. -
Import validation failure. - Export failure. - Authentication failure. -
Storage or database error.

Do not leave blank screens or rely on generic system error text.

### 6.7 Accessibility

-   Meet Android accessibility guidance for touch target sizes.
-   Provide meaningful semantics and content descriptions.
-   Maintain accessible color contrast in light and dark themes.
-   Support font scaling and display size changes.
-   Do not communicate folder privacy or bookmark state through color
    alone.
-   Support TalkBack navigation and logical focus order.
-   Respect system reduced-motion settings.

------------------------------------------------------------------------

## 7. Technical architecture

### 7.1 Application technology

The product owner has selected **React Native** and **Material 3 Expressive** for the Android app. The detailed package and native-integration decisions are documented in `Paperclip_TRD.md`.

| Concern | Product-level direction |
|---|---|
| Platform | Android |
| Application framework | React Native |
| Language | TypeScript recommended |
| Design system | Material 3 Expressive |
| Persistence | Local database; no backend required |
| File storage | App-managed local storage for preview assets and backups |
| Authentication | Android biometric/device authentication for protected folders |
| Import/export | Versioned portable backup files |
| Connectivity | Core library works offline |

No backend, user account, or cloud synchronization is required for the MVP.

### 7.2 Architecture

Use a modular, testable React Native architecture with clear separation between UI, domain behavior, repositories, and native integrations:

```text
React Native Screens and Components
              |
       View models / hooks
              |
       Domain use cases
              |
          Repositories
       /       |        \
  SQLite   File store   Native Android services
       \       |        /
   Metadata / Security / Backup services
```

The Android sharing integration receives incoming links. A metadata service retrieves safe page metadata; an image service caches validated previews. Security services protect private content, and backup services serialize and restore user data.

Keep UI code separate from metadata extraction, persistence, and encryption logic.

### 7.3 Suggested feature structure

```text
app/
  (tabs)/
    index.tsx             # Home — recent folders only
    folders.tsx           # Complete folder library
    settings.tsx
  search.tsx              # Secondary route launched from Folders
  folders/[folderId].tsx
  bookmarks/all.tsx
  bookmarks/[bookmarkId].tsx
  bookmarks/save.tsx
  private/unlock.tsx
  backup/index.tsx

src/
  core/
    database/
    files/
    network/
    security/
    share/
    backup/
  features/
    home/
    folders/
    bookmarks/
    search/
    save-link/
    private-folders/
    settings/
    backup/
  shared/components/
  theme/
  types/
```

This is a suggested organization, not a requirement to use a specific router or folder convention. The TRD provides the detailed proposed implementation structure.

### 7.4 Data model

#### Folder

| Field | Type | Notes |
|---|---|---|
| id | UUID/String | Primary key |
| name | String | Required |
| icon | String, nullable | Optional icon/emoji identifier |
| color | String, nullable | Optional theme token or color value |
| isPrivate | Boolean | Whether folder is protected |
| sortOrder | Integer | User-visible ordering |
| createdAt | Timestamp | Creation time |
| updatedAt | Timestamp | Last modification time |
| lastOpenedAt | Timestamp, nullable | Last time opened; used to order Home recent folders |

#### Bookmark

  --------------------------------------------------------------------------------------------
  Field                   Type                    Notes
  ----------------------- ----------------------- --------------------------------------------
  id                      UUID/String             Primary key

  originalUrl             String                  URL received from user

  canonicalUrl            String?                 Metadata-derived canonical URL

  title                   String                  Extracted or user-edited

  titleIsUserEdited       Boolean                 Prevent refresh from overwriting user title

  description             String?                 Extracted metadata

  note                    String?                 User-authored note

  folderId                String?                 Nullable/Uncategorized

  sourceName              String?                 Site/platform label

  domain                  String?                 Hostname

  faviconPath             String?                 Local cached asset

  previewImagePath        String?                 Local cached image

  previewStatus           Enum                    pending/success/partial/unavailable/failed

  previewFetchedAt        Long?                   Last metadata fetch

  createdAt               Long                    Save timestamp

  updatedAt               Long                    Last edit timestamp
  --------------------------------------------------------------------------------------------

Private bookmark records and their sensitive fields must be encrypted at
rest. The final database design must ensure that search indexing and
preview caching do not leak private content.

#### Settings

Store non-secret preferences in an appropriate local preference store, such as theme mode, dynamic-color preference, default bookmark view, private-folder auto-lock duration, and search preferences. Do not store PINs, encryption keys, or other secrets in ordinary preferences.

Do not store cryptographic secrets or PINs in ordinary preferences.

### 7.5 Metadata extraction implementation

Implement a dedicated metadata extraction component.

Input: - User-submitted URL.

Output: - Resolved URL (if redirected). - Canonical URL (if present and
valid). - Title. - Description. - Site name. - Preview image URL. -
Favicon URL. - Fetch status and timestamp.

Implementation constraints: - Use a maintained HTTP client. - Parse HTML
metadata without executing JavaScript. - Apply strict URL, redirect,
response-size, timeout, and content-type validation. - Protect against
SSRF and redirect-to-private-network attacks. - Do not make network
requests on the main thread. - Do not block bookmark persistence on
metadata extraction. - Do not assume that social-media pages expose Open
Graph metadata. - Unit-test malformed HTML, absent tags, duplicate tags,
redirects, invalid URLs, timeouts, oversized responses, and blocked
destinations.

### 7.6 Local image cache

-   Cache preview images in app-managed storage.
-   Use stable bookmark-associated filenames or IDs.
-   Keep image cache separate from the SQLite database; store
    paths/identifiers in SQLite.
-   Handle cache cleanup when a bookmark is deleted or its preview is
    replaced.
-   Avoid deleting images still referenced by another record.
-   Set reasonable image size and dimension limits.
-   Consider a cache size limit and cleanup policy.
-   Private-folder preview images must receive equivalent
    encryption/protection and must not appear in shared/public cache
    paths.

------------------------------------------------------------------------

## 8. Core user flows

### 8.1 Share and save

``` text
Source app
  -> Android Sharesheet
  -> Paperclip receives shared text
  -> URL validation
  -> Create provisional local bookmark
  -> Fetch metadata in background
  -> Render preview or fallback card
  -> User chooses folder / edits title or note
  -> Save confirmation
  -> Bookmark appears in library
```

The app should persist the URL promptly. Metadata retrieval must not be
a prerequisite for saving.

### 8.2 Open a saved link

``` text
User taps bookmark card
  -> Resolve Android VIEW intent
  -> Open source app or browser
  -> If no handler is available, show a helpful error/action
```

### 8.3 Unlock a private folder

``` text
User selects locked folder
  -> Authentication prompt
  -> Verify biometric or PIN
  -> Decrypt/access folder content
  -> Show private bookmark previews
  -> Lock on exit or inactivity timeout
```

### 8.4 Export backup

``` text
Settings -> Export
  -> Choose whether private folders are included
  -> If included, configure encrypted backup
  -> Choose destination with Storage Access Framework
  -> Create and validate archive
  -> Write file
  -> Show success summary
```

### 8.5 Import backup

``` text
Settings -> Import
  -> Select backup file
  -> Validate schema and archive
  -> Request backup password if encrypted
  -> Show import summary and duplicate policy
  -> Import transactionally
  -> Show results
```

------------------------------------------------------------------------

## 9. Non-functional requirements

  -----------------------------------------------------------------------
  Category                            Requirement
  ----------------------------------- -----------------------------------
  Performance                         Home/library should feel immediate
                                      for a typical personal library

  Search                              Target under 300 ms for 10,000
                                      bookmarks on a representative
                                      mid-range device

  Capture                             URL persistence should not wait for
                                      metadata retrieval

  Offline                             Browse folders, bookmarks, notes,
                                      and cached previews offline

  Privacy                             No mandatory account, analytics
                                      SDK, or remote sync

  Security                            Private folder content encrypted at
                                      rest

  Reliability                         Database migrations and backup
                                      restore tested

  Scale                               Target at least 10,000 bookmarks
                                      without noticeable degradation

  Compatibility                       Set and document a sensible minimum
                                      Android API level during setup;
                                      target current Play requirements

  Accessibility                       TalkBack, font scaling, contrast,
                                      and touch targets

  Battery                             No repeated background metadata
                                      polling

  Maintainability                     Modular code, clear boundaries,
                                      automated tests
  -----------------------------------------------------------------------

Performance targets must be measured on representative devices rather
than treated as guaranteed.

------------------------------------------------------------------------

## 10. Testing and acceptance criteria

### 10.1 Functional acceptance criteria

  -----------------------------------------------------------------------
  ID                                  Acceptance criterion
  ----------------------------------- -----------------------------------
  AC-01                               Paperclip appears as a target when
                                      another app shares a URL or
                                      supported text

  AC-02                               A valid URL can be saved even when
                                      offline

  AC-03                               A saved bookmark remains after app
                                      restart

  AC-04                               Every bookmark is rendered as a
                                      visual preview card or designed
                                      fallback card

  AC-05                               A preview image is cached locally
                                      when retrieval succeeds

  AC-06                               A missing/broken image never
                                      produces a broken-image icon or
                                      blank card

  AC-07                               A user-edited title is not
                                      overwritten by metadata refresh

  AC-08                               User can create, rename, and delete
                                      folders

  AC-09                               User can move a bookmark between
                                      folders

  AC-10                               Folder deletion clearly explains
                                      what happens to its bookmarks

  AC-11                               Search matches title, URL/domain,
                                      description, note, and folder name

  AC-12                               Locked folder content is excluded
                                      from normal search until unlocked

  AC-13                               Private content is encrypted at
                                      rest

  AC-14                               Biometric/PIN authentication gates
                                      access to private folders

  AC-15                               Private content is not exposed in
                                      logs, notifications, or
                                      app-switcher previews

  AC-16                               JSON export preserves supported
                                      bookmark and folder data

  AC-17                               Import validates the backup and
                                      handles duplicates according to
                                      user choice

  AC-18                               Private backup data is never
                                      silently exported in plaintext

  AC-19                               Core library browsing and search
                                      work offline

  AC-20                               App follows Material 3 Expressive
                                      styling and supports light/dark
                                      themes

  AC-21                               Primary navigation is a floating
                                      bottom bar with exactly Home,
                                      Folders, and Settings

  AC-22                               Home shows recent folders only; it
                                      has no See All action and no recent
                                      bookmark cards

  AC-23                               Folders opens the complete folder
                                      library; Search is launched from
                                      Folders and is not a navigation tab
  -----------------------------------------------------------------------

### 10.2 Preview-specific test cases

Test at minimum:

-   Standard website with complete Open Graph tags.
-   Website with title but no image.
-   Website with image but no description.
-   Website with only HTML title.
-   Website with no useful metadata.
-   Instagram URL where metadata is blocked.
-   YouTube URL.
-   Reddit URL.
-   Redirecting URL.
-   Invalid URL.
-   Offline save.
-   Image URL returning an error.
-   Image URL returning an unsupported MIME type.
-   Oversized image.
-   Metadata timeout.
-   User-edited title followed by refresh.
-   Deleted bookmark and associated cached image cleanup.
-   Private bookmark preview not leaking into public cache/UI.

### 10.3 Security test cases

-   Attempt to fetch localhost/private IP URLs.
-   Attempt redirect from a public URL to a private IP.
-   Verify response size and timeout limits.
-   Verify private database content is not readable as plaintext.
-   Verify private preview files are protected.
-   Verify logs do not contain private content or secrets.
-   Verify exported private content is encrypted when included.
-   Verify authentication lock behavior after app backgrounding and
    inactivity.

------------------------------------------------------------------------

## 11. Release plan

### Phase 1 --- Foundation and capture

-   Create the React Native Android project foundation and shared UI shell.
-   Configure Material 3 Expressive theme using stable dependencies.
-   Set up the floating Home / Folders / Settings navigation and reusable UI components.
-   Configure SQLite database and repositories.
-   Implement Android share intent handling.
-   Implement manual URL entry.
-   Save bookmarks and folders locally.
-   Implement metadata extraction and preview image caching.
-   Build reusable preview cards and fallback states.
-   Build Home (recent folders only), Folders, All Bookmarks, Folder Details, and Save Link screens.

### Phase 2 --- Organization and retrieval

-   Implement folder CRUD.
-   Implement move bookmark.
-   Implement search.
-   Implement bookmark actions.
-   Implement offline behavior and error states.
-   Add sorting and empty states.
-   Test large libraries and accessibility.

### Phase 3 --- Privacy and backup

-   Design and document encryption/key lifecycle.
-   Implement private folders and authentication.
-   Protect private preview images and UI surfaces.
-   Implement JSON backup/export.
-   Implement import validation and duplicate handling.
-   Implement encrypted private backups.
-   Test recovery and failure scenarios.

### Phase 4 --- Polish and release readiness

-   Complete dark theme and dynamic color.
-   Verify Material 3 Expressive component usage.
-   Tune motion and adaptive navigation.
-   Add CSV export if time permits.
-   Run functional, UI, performance, accessibility, and security tests.
-   Verify app behavior across supported Android versions and device
    sizes.

------------------------------------------------------------------------

## 12. Analytics and success metrics

The MVP should not require third-party analytics. If product analytics
are added later, they must be opt-in or privacy-preserving and must
never transmit saved URLs, titles, notes, or private-folder information.

Initial product quality targets:

  -----------------------------------------------------------------------
  Metric                                                           Target
  ------------------------------ ----------------------------------------
  Normal save flow                    Under 5 seconds of user interaction

  Search response                    Under 300 ms for 10,000 bookmarks on
                                                            target device

  URL persistence                         Independent of metadata success

  Preview card coverage            100% of saved bookmarks have a rich or
                                                            fallback card

  Backup restore                 All valid supported test backups restore
                                                                correctly

  Data loss                       Zero known data-loss defects in release
                                                                  testing

  Crash-free sessions            At least 99.5% in release monitoring, if
                                                       monitoring is used
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 13. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Instagram blocks metadata           Always save URL first; provide
  extraction                          designed fallback cards and manual
                                      title editing

  Websites have malformed or missing  Use ordered metadata fallbacks and
  metadata                            robust HTML parsing

  Preview image URLs expire           Cache images locally and allow
                                      refresh

  Metadata fetching creates           Local extraction, strict URL
  privacy/security exposure           validation, SSRF protection, no
                                      third-party metadata service by
                                      default

  Private folder data leaks through   Encrypt private data/assets and
  cache/search/logs                   isolate private search/rendering
                                      paths

  User loses local data after         Provide clear backup guidance and
  uninstall                           reliable export/import

  Backup format changes over time     Version schema and implement
                                      migrations

  App becomes visually cluttered      Keep the core library focused and
                                      use progressive disclosure
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 14. Decisions and implementation assumptions

Unless the product owner changes them, use these defaults:

1.  **Saving:** Android Sharesheet plus manual paste/add.
2.  **Private folders:** biometric authentication with PIN fallback;
    encrypted at rest.
3.  **Opening links:** open externally using Android intent resolution.
4.  **Previews:** extract metadata and cache images locally; always
    render a polished fallback card.
5.  **Visual design:** React Native implementation following Material 3 Expressive, light/dark themes, dynamic color where available, and a floating Home / Folders / Settings navigation bar.
6.  **Storage:** SQLite database and app-managed local files; no backend.
7.  **Backup:** versioned JSON archive; private content requires
    encrypted backup.
8.  **Bookmark organization:** one folder per bookmark in MVP, with
    Uncategorized as default.

------------------------------------------------------------------------

## 15. Instructions for the implementation agent

Treat this PRD as the product source of truth.

Before implementation:

1.  Inspect the existing repository and identify whether it is a new or
    existing Android project.
2.  Use React Native for the Android application. Follow `Paperclip_TRD.md` for the proposed TypeScript / Expo baseline, but inspect the existing repository before changing its framework or versions.
3.  Check official Android documentation and current stable dependency
    versions. Do not blindly copy outdated versions or use alpha/beta
    dependencies for production.
4.  Convert this PRD into a short implementation plan with milestones
    and a clear file/package structure.
5.  Identify unresolved technical decisions, especially private-folder
    encryption, preview fetching security, and backup format, before
    implementing those areas.
6.  Build the app incrementally. Do not generate the entire application
    in one unreviewed step.
7.  Keep the app buildable after each milestone.
8.  Write tests for URL parsing, metadata extraction, preview fallback
    behavior, persistence, search, backup validation, and private-folder
    access.
9.  Do not substitute mock data for working persistence or real
    share-intent handling.
10. Do not claim a feature is complete until its acceptance criteria and
    relevant tests pass.

### Definition of done

The MVP is done when a user can share or paste a link, save it locally,
see a rich or fallback visual preview, organize it in folders, search
for it, protect a private folder, and export/import their
library---without needing an account or cloud backend.
