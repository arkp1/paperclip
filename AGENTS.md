# Paperclip — AI Coding Agent Instructions

**Document:** `AGENTS.md`  
**Product:** Paperclip — Android link and article saver  
**Applies to:** Every AI coding agent, coding assistant, automated refactoring tool, and human contributor working in this repository  
**Status:** Project implementation contract  
**Last updated:** 2 November 2026

---

## 1. Mission and non-negotiable principles

You are implementing **Paperclip**, an Android-first, local-first app for saving links from Instagram, YouTube, Reddit, browsers, and other apps; viewing visual previews; organizing saved links into folders; protecting private folders; searching the local library; and importing/exporting the user's data.

Your job is to implement the product described by the project documents—not to reinterpret the product, invent extra features, or redesign the architecture while completing an unrelated task.

Follow these principles in every change:

1. **Preserve user data.** Never perform a destructive database, filesystem, import, or migration operation without a safe and tested path.
2. **Local-first.** SQLite is the source of truth for bookmarks and folders. Core library operations must work offline. No account, hosted backend, or cloud sync is part of the MVP.
3. **Privacy is a security property.** A private folder is not secure merely because the UI hides it. Enforce privacy at storage, repository, search, asset, logging, and app-switcher boundaries.
4. **Save before enriching.** A valid URL must be saved even when the device is offline or metadata extraction fails. Preview retrieval must never be a prerequisite for saving.
5. **Visual-first library.** Every saved bookmark must render as a designed preview card or a polished fallback card. Never make a raw URL-only row the normal bookmark presentation.
6. **Native Android quality.** Respect Android navigation, safe areas, accessibility, permissions, system back behavior, and Material 3 Expressive design intent.
7. **Small, understandable engineering.** Prefer the simplest architecture and smallest dependency set that safely meets the requirements. Do not add layers, libraries, abstractions, or configuration without a concrete need.
8. **Verify, do not assume.** Inspect the actual repository, build configuration, and installed package versions before changing them. Run the relevant checks and report what was and was not verified.

Do not treat an instruction to implement a feature as permission to change product scope, security guarantees, app identity, native configuration, or existing user data.

---

## 2. Project specification and source-of-truth order

Read the relevant project documents before implementing or modifying a feature. They are intended to be used together.

| Document                                    | Authority / purpose                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Paperclip_PRD.md`                          | Product goals, scope, user stories, feature requirements, priorities, and acceptance criteria.                           |
| `Paperclip_TRD.md`                          | Technical baseline, recommended stack, architecture, native integrations, security, backup, and implementation guidance. |
| `Folder Structure and Code Architecture.md` | Module responsibilities, boundaries, code organization, and feature implementation patterns.                             |
| `DATABASE_SCHEMA.md`                        | SQLite entities, relationships, constraints, indexes, migrations, and data-integrity rules.                              |
| `USER_FLOWS.md`                             | Expected user journeys, navigation behavior, validation, and UI states.                                                  |
| `UI_UX_SPECIFICATION.md`                    | Screen composition, navigation behavior, and interaction requirements.                                                   |
| `DESIGN_SYSTEM.md`                          | Visual tokens, typography, color, shapes, spacing, iconography, and reusable component guidance.                         |
| Figma design file                           | Visual exploration and screen reference; it does not override the written product or accessibility requirements.         |

### 2.1 How to resolve conflicts

- Follow the **current written product decisions** in the PRD, TRD, user flows, UI/UX specification, and design system.
- Use the database schema for persistence behavior and the TRD / architecture document for technical boundaries.
- Use the Figma file as a visual reference, not as permission to revive an older product decision. Some visual explorations may show earlier navigation. Where a Figma screen conflicts with the current written navigation contract, follow the written contract.
- If two written documents materially contradict each other, do not silently choose whichever is easier to implement. Identify the exact conflict, explain its impact, and ask for a product-owner decision before making an irreversible or user-visible choice.
- If implementation reality requires a change to a documented requirement, stop at the smallest safe boundary, explain the constraint and alternatives, and request approval. Do not quietly weaken the requirement.

### 2.2 Confirmed product contract

These decisions are fixed unless the product owner explicitly changes them:

- Android application; React Native implementation.
- Expo + TypeScript is the preferred baseline unless the existing repository already has a sound alternative configuration. Inspect before changing it.
- Material 3 Expressive is the design direction, implemented with real React Native components and verified native integrations—not screenshots used as UI.
- Exactly three top-level destinations: **Home**, **Folders**, and **Settings**.
- The primary navigation is a **floating capsule-style bottom bar**, not a conventional full-width bar attached to the bottom edge.
- **Home shows recent folders plus a recently saved preview.** Show up to six recent folders by `lastOpenedAt` order (with the documented fallback for folders that have never been opened) and up to four recently saved public bookmarks with a “View all” action. Home does not show a search field, the full folder catalogue, or a See All action for folders. (Product-owner decision, 3 November 2026.)
- **Folders** is the full folder-library destination. It provides access to all user-created folders, All Bookmarks, Uncategorized, and the Search entry point.
- **Search is a secondary route**, opened from the search action in the Folders screen. It is not a bottom-navigation item.
- Settings contains app preferences, appearance, private-folder/security controls, and backup/import-export entry points as specified by the product documents.
- The Add Link action is a separate floating action; it is not a navigation destination.
- No mandatory account, sign-in, remote database, hosted backend, or cloud sync for the MVP.
- Paperclip stores URLs, metadata, and locally cached preview assets. It does not download or rehost original Instagram posts, YouTube videos, or full platform content.
- A bookmark can be saved even without metadata, an image, or an internet connection.
- Private-folder contents must be inaccessible through normal UI, repository queries, search, app previews, logs, and unprotected local files while locked.

---

## 3. Mandatory repository inspection before coding

Before the first code change in a task, inspect the repository. Do not assume that the project is empty or that the proposed documents describe the repository's current state.

At minimum, inspect:

- `package.json` and the actual package manager lockfile.
- Expo SDK, React Native, React, TypeScript, and Node compatibility.
- `app.json`, `app.config.ts`, Expo config plugins, and relevant environment configuration.
- Existing `app/`, `src/`, and `android/` structure, including whether native Android files are generated or maintained directly.
- Existing navigation, theme, database, storage, and test implementations.
- Git status and recent changes, so you do not overwrite unfinished user work.
- Existing scripts for linting, formatting, type checking, tests, and Android builds.

Then:

1. Identify the smallest relevant implementation area.
2. Reuse existing conventions and components where they are sound.
3. Compare existing behavior with the relevant product acceptance criteria.
4. State any important assumptions or blockers before making a broad change.
5. Make focused changes; do not recreate the app or reorganize unrelated files.

**Never blindly upgrade Expo, React Native, React, Node tooling, or native dependencies.** The TRD's version table is a compatibility baseline, not permission to replace working versions in the repository. Check installed versions and the current Expo compatibility matrix first. For Expo-managed packages, prefer `npx expo install` over an arbitrary package version. Keep the lockfile consistent with the package manager already in use.

---

## 4. Coding standards

### 4.1 TypeScript and JavaScript

- Use TypeScript for application code. Keep strict type checking enabled.
- Prefer explicit, useful domain types and narrow function signatures.
- Avoid `any`. If an untyped third-party boundary makes it unavoidable, isolate it, add a comment explaining why, validate the value, and convert it to a safe internal type immediately.
- Use `unknown` rather than `any` for untrusted external values.
- Validate data entering from Android share intents, deep links, network responses, file imports, route parameters, and native modules.
- Do not use unsafe type assertions to silence errors. Narrow types through validation or correct the underlying type.
- Keep functions small and cohesive. Extract a helper when it gives a meaningful name to non-trivial logic or removes real duplication—not merely to reduce line count.
- Use `async` / `await` and explicit error paths for asynchronous work.
- Avoid hidden side effects in render functions, getters, and utility functions.
- Do not use `useEffect` to mirror values that can be derived during render or to coordinate ordinary event-driven actions.
- Clean up subscriptions, listeners, timers, and abortable requests when their owner unmounts or the operation is superseded.

### 4.2 Naming and formatting

Follow the repository's formatter and lint configuration. Do not introduce a second formatting or linting system.

Use these conventions unless the existing repository has a consistent established alternative:

- `PascalCase` for React components and component files.
- `camelCase` for functions, variables, hooks, and object properties.
- `UPPER_SNAKE_CASE` for true module-level constants.
- Prefix custom hooks with `use`.
- Name booleans so their meaning is clear (`isPrivate`, `hasPreview`, `isLoading`).
- Use descriptive names tied to Paperclip's domain (`bookmark`, `folder`, `previewMetadata`) rather than vague names (`data`, `item`, `value`) when the context is not obvious.
- Keep one primary component per file where that improves readability; small tightly related private subcomponents may remain together.
- Avoid unexplained abbreviations and misleading names.

### 4.3 React Native practices

- Use React Native primitives and the approved design-system components.
- Use `StyleSheet.create` or the styling convention already established by the project. Do not introduce a new styling library for one component.
- Keep UI components focused on presentation and interaction. Move persistence, network extraction, cryptography, and complex business rules out of component bodies.
- Use stable keys for rendered collections.
- Avoid unnecessary renders and expensive work in render paths. Memoize only after identifying a meaningful performance reason.
- Use `FlatList` or an appropriate virtualized list for collections that can grow. Do not render thousands of bookmarks in a single unvirtualized `ScrollView`.
- Respect Android Back behavior, keyboard behavior, status/navigation bars, edge-to-edge insets, and device safe areas.
- Never rely on web-only APIs or browser globals in React Native code unless an explicitly installed and compatible runtime/polyfill provides them.

### 4.4 Comments and documentation

- Write comments to explain non-obvious reasoning, security assumptions, compatibility workarounds, or important invariants.
- Do not narrate obvious code line by line.
- Update documentation when a change alters a documented contract, schema, setup step, or developer workflow.
- Do not claim that an integration is secure, encrypted, offline-capable, or tested unless the corresponding implementation and verification exist.

---

## 5. Framework and library restrictions

### 5.1 Preferred platform baseline

- Android is the MVP platform.
- React Native is the application framework.
- Prefer Expo and Expo Router when compatible with the existing project.
- Use TypeScript.
- Use Hermes unless a verified compatibility issue requires a change.
- Use a custom Expo development build / native Android build for features requiring native modules, config plugins, Android Sharesheet registration, SQLCipher, or Android Keystore integration. Expo Go is suitable only for limited early UI experiments and is not the acceptance environment for the complete app.

### 5.2 Recommended libraries are optional, not a shopping list

The TRD lists candidate packages for routing, SQLite, files, secure storage, biometrics, share intents, image rendering, input validation, HTML parsing, and testing. Add a package only when the current task requires it and its compatibility has been checked.

Potential choices include:

- Expo Router for navigation.
- `expo-sqlite` for SQLite persistence and migrations.
- Verified SQLCipher support for database-at-rest encryption.
- `expo-file-system` for app-managed preview and backup files.
- `expo-image` for local image rendering, caching, and placeholders.
- `expo-secure-store` for small secrets or wrapped key material—not as the bookmark database.
- `expo-local-authentication` for supported biometric prompts, with a verified key-release design for protected data.
- A compatible share-intent integration for Android incoming shares.
- `expo-sharing` / React Native Share API for outgoing sharing.
- `expo-document-picker` for selecting backup files.
- Zod or an equivalent lightweight runtime validator at untrusted input boundaries.
- Jest, React Native Testing Library, and Maestro or Detox for tests.

These names are options, not authorization to install all of them. Confirm the package's current maintenance state, Expo SDK compatibility, Android support, New Architecture support where relevant, and license before adoption.

### 5.3 Dependency rules

Before adding or changing a dependency:

1. Check whether the capability already exists in the project or can be implemented safely with the platform APIs already present.
2. Explain the concrete gap the dependency fills.
3. Verify compatibility with the installed Expo / React Native versions and Android build setup.
4. Prefer a maintained, focused package with a small transitive dependency footprint.
5. Add it through the repository's existing package manager and commit/update the lockfile as appropriate.
6. Run the relevant dependency, type, test, and native build checks.

Do NOT:

- Install a library just because it is popular or appears in a tutorial.
- Add multiple libraries that solve the same problem.
- Add a state-management library by default. React hooks and feature hooks are sufficient unless cross-screen transient state demonstrates a real need. Zustand is a possible small-store option, not a requirement.
- Add a backend-oriented data-fetching/cache library to access local SQLite data.
- Add an ORM solely for fashion or abstraction. Use parameterized SQLite queries unless an ORM materially improves the implementation and is verified with the selected SQLCipher setup.
- Add a large UI kit without first checking whether it satisfies the design, accessibility, native behavior, and compatibility requirements.
- Treat React Native Paper as a complete implementation of every Material 3 Expressive component. Evaluate its actual supported components and implement missing behavior deliberately.
- Add analytics, advertising, crash-reporting telemetry, remote configuration, cloud storage, authentication providers, or network sync without explicit approval and a privacy review.
- Add WebViews, browser automation, or page JavaScript execution to scrape original platform content.
- Use unpinned `latest`, nightly, canary, alpha, or release-candidate packages in a production path without explicit approval and compatibility testing.
- Change package managers or replace the lockfile without explicit approval.

### 5.4 Native project and permissions

- Prefer Expo config plugins and Continuous Native Generation when they can express a native change reliably.
- Do not make manual edits to generated native files that will be lost on regeneration. If direct native maintenance is already part of the repository, follow its established approach.
- Explain why each Android permission is needed. Request the narrowest possible permission and only at the point where it is needed.
- Do not request broad storage access when the Storage Access Framework / document picker can provide a user-selected file.
- Do not add accessibility, notification, contacts, location, camera, microphone, or other unrelated permissions.
- Do not alter application ID, signing configuration, keystore, intent filters, exported components, target SDK, or manifest security settings without approval, except for a narrowly scoped feature implementation that is already explicitly specified and can be safely reviewed.

---

## 6. Architecture rules

### 6.1 Keep architecture proportional

Use the feature-oriented structure described in `Folder Structure and Code Architecture.md`. Adapt it to the repository instead of forcing a large reorganization.

Conceptual dependency direction:

```text
Routes / Screens / Components
             |
       Feature hooks
             |
       Feature operations
             |
        Repositories
          /     \
      SQLite   File store
          \     /
       Core services / native bridges
```

The implementation may use fewer layers when a feature is simple. Do not create an interface, factory, service, adapter, provider, or abstraction unless it has a clear role, boundary, or testability benefit.

### 6.2 Responsibility boundaries

- **`app/`:** route declarations, layouts, route parameters, and navigation configuration. Keep route files thin.
- **`features/`:** product capabilities and their screens, feature-specific components, hooks, validation, and operations.
- **`core/`:** shared infrastructure such as database connection/migrations, filesystem, security/key management, metadata retrieval, share-intent integration, backup archive handling, and platform bridges.
- **`shared/`:** generic UI building blocks and genuinely shared utilities.
- **`theme/`:** semantic design tokens, themes, and component styling foundations.

Follow the actual repository's names if it already has an equivalent structure. Do not move files across the repository just to match this example.

### 6.3 Data ownership and repositories

- SQLite is the single source of truth for bookmark, folder, and persisted settings data.
- Preview images and other binary assets belong in app-managed filesystem storage; store their paths and relevant metadata in SQLite.
- UI components must not execute SQL directly.
- Put SQL and persistence operations behind a small set of repositories or query modules.
- Use parameterized SQL for every value originating from user input or external data.
- Keep repository methods focused on domain operations, not presentation decisions.
- Use stable IDs for folders and bookmarks. Do not use array indices as record identifiers.
- Use transactions for multi-step changes that must succeed or fail together.
- Avoid holding duplicate full copies of bookmark/folder data in AsyncStorage, a global store, or another persistence layer.
- Local view state may live in React state. Cross-screen transient state may use a small store only when justified.

### 6.4 Folder and bookmark invariants

- `folder_id = NULL` means Uncategorized.
- All Bookmarks is a virtual collection, not a real database folder row.
- Uncategorized is a virtual collection, not a real database folder row.
- A bookmark belongs to zero or one user-created folder.
- Deleting a folder must never silently cascade-delete its bookmarks. Present the documented user choice and perform the selected behavior transactionally.
- Moving a bookmark changes its folder association; it must not create an accidental duplicate.
- Opening a folder updates `last_opened_at` after a successful open.
- Home's recent-folder query returns folders only, ordered by `last_opened_at` descending, with the documented fallback for folders without an open timestamp.
- Do not build a separate hard-coded data source for Home. Query the same canonical folder repository.

### 6.5 Metadata retrieval and preview pipeline

- Saving a URL and retrieving its metadata are separate operations.
- Persist a valid URL and a provisional bookmark before starting or awaiting network enrichment.
- Metadata extraction must be bounded by timeouts, response-size limits, allowed content types, and safe redirect handling.
- Accept only supported `http` and `https` URLs. Reject malformed or unsupported schemes such as `javascript:`, `file:`, and arbitrary intent schemes unless an explicit, reviewed handler exists.
- Do not execute remote page JavaScript to obtain metadata.
- Do not download, rehost, or claim offline availability of the original post, video, or full article.
- Treat page metadata, image URLs, redirects, and share-intent strings as untrusted input.
- Protect the app from requests to localhost, private, loopback, link-local, and other prohibited destinations. Validate redirects as well as the initial URL. If the React Native networking stack cannot enforce the necessary destination/redirect policy, use a reviewed native-safe approach or document a blocker; do not claim SSRF protection without tests.
- A blocked platform, absent Open Graph tags, broken image, timeout, or offline device must result in a useful fallback card—not a failed save.
- Preserve the user-submitted URL separately from a discovered canonical URL when the data model requires both.
- Avoid refetching metadata unnecessarily. Respect stored preview status and provide bounded retry behavior.

### 6.6 Search

- Search is local and must work without a network connection.
- Search the fields defined by the PRD and UI specifications, including relevant title, URL/domain, description, notes, and folder name.
- Use the database search/index strategy documented in the TRD and schema. Verify optional FTS support in the actual Android build before depending on it.
- Filter locked private records at the repository/query boundary. A UI filter alone is insufficient.
- A normal search query, suggestion, result count, empty state, or recent-query list must not leak private titles, URLs, notes, domains, or thumbnails while locked.
- Preserve a back path to Folders. Search is not a tab.
- Keep search responsive for the documented target library of at least 10,000 bookmarks; profile actual devices rather than assuming performance.

### 6.7 Import and export

- Treat backup files as untrusted input.
- Validate archive structure, manifest version, field types, IDs, relationships, asset references, file sizes, and supported schema versions before modifying the library.
- Reject path traversal / zip-slip entries, suspicious archive expansion, malformed JSON, unsupported versions, and oversized payloads safely.
- Do not partially replace the user's library if validation fails.
- Make import behavior explicit: merge/skip/replace semantics must match the product specification and user confirmation.
- Use a transaction or staged import so a failed import can be rolled back without corrupting existing data.
- Preserve relationships and supported metadata. Do not silently discard unknown data that the versioning strategy says must be retained or rejected.
- Private data included in backups must be protected according to the backup security specification. Do not export private content in plaintext under the guise of an ordinary backup.
- Do not change the backup format or versioning contract without approval.

---

## 7. UI implementation rules

### 7.1 Use the design system

- Read `DESIGN_SYSTEM.md` and `UI_UX_SPECIFICATION.md` before implementing or restyling screens.
- Use centralized semantic tokens for color, typography, shape, spacing, elevation, icons, and motion.
- Do not scatter raw hex colors, arbitrary font sizes, corner radii, shadows, or spacing values through feature components.
- Support light and dark themes. Support Android dynamic color where it is available and reliable, with the designed Paperclip palette as a fallback.
- Use one consistent icon family. Do not mix unrelated icon libraries or emoji as substitutes for functional icons.
- Build actual accessible React Native components. Do not use a flattened screenshot, exported Figma frame, or image of a UI as the screen implementation.
- Use the Figma file for visual hierarchy and composition, but follow the current written navigation and product requirements when a mockup is stale.

### 7.2 Navigation contract

Implement exactly these root destinations:

1. **Home**
2. **Folders**
3. **Settings**

The bottom navigation must be a floating capsule with clear separation from the screen edge and content. It must not become a full-width, edge-attached conventional tab bar.

- Do not add Search or Add as navigation destinations.
- Search opens from the action in the Folders top app bar and is a secondary route.
- Save Link, Search, Folder Details, Bookmark Details, Private Folder Unlock, and focused import/backup flows should hide the floating bar unless a documented and tested hierarchy specifically requires otherwise.
- The Add Link floating action is separate from navigation and must not overlap the floating capsule, system navigation area, or important content.
- Preserve Android back-stack and system-back behavior.

### 7.3 Home screen: recent folders and recently saved

Home has a strict content contract:

- Display a heading such as “Recent folders”.
- Display up to six recent folder cards, ordered by the most recently opened folders first.
- For folders that have never been opened, use the fallback ordering specified in the PRD / TRD / database schema.
- Locked folders may appear as protected folder entries with a lock indicator, but must not reveal bookmark titles, notes, URLs, or preview images.
- Show an appropriate Create Folder empty state when there are no folders.
- Show up to four recently saved public bookmarks in a “Recently saved” preview with a “View all” action (product-owner decision, 3 November 2026). Locked private content must never appear in this preview.
- Do **not** show a bookmark feed beyond the four-item preview, a search field, search results, the entire folder catalogue, or a “See All” action for folders on Home.

The full collection belongs on Folders.

### 7.4 Folders, bookmark cards, and Search

- Folders displays the complete user-created folder collection and the documented All Bookmarks / Uncategorized entry points.
- Private folder entries can show that they are locked, but their contents remain hidden until authentication succeeds.
- Every bookmark must have a visual card. Use the best available local preview image and metadata; otherwise use a consistent branded fallback with available title/domain/source information.
- Support the specified grid and list presentation variants where required by the current design and screen context.
- Do not show a broken-image icon, empty image hole, or a raw URL as the only visual content.
- Search results use the same bookmark card system and never expose locked private content.
- Empty, loading, offline, metadata-pending, missing-image, no-results, and error states must be deliberately designed. Do not leave screens blank while a query or image is loading.

### 7.5 Interaction, accessibility, and responsive behavior

- Follow Android interaction conventions and the Material 3 Expressive intent in the design system.
- Interactive controls need visible pressed, focused, selected, disabled, loading, and error states where applicable.
- Use touch targets of at least 48dp for primary interactive elements unless a platform convention or documented accessibility rationale specifies otherwise.
- Provide accessible labels and roles for icon-only buttons, FABs, navigation items, and custom controls.
- Support TalkBack, screen-reader focus order, meaningful content descriptions, and Android font scaling.
- Maintain sufficient color contrast in both themes. Never communicate a critical state using color alone.
- Respect keyboard appearance, input focus, text selection, and form submission behavior.
- Respect system reduced-motion preferences. Motion should clarify hierarchy or state change, not delay routine actions.
- Handle narrow and large Android screens, landscape where applicable, and safe-area/edge-to-edge insets.
- Use skeletons or placeholders only when they improve continuity; do not create misleading placeholder content that looks saved when it is not.

### 7.6 Dialogs, sheets, and destructive actions

- Use shared dialog and bottom-sheet patterns from the design system.
- Explain destructive consequences in plain language.
- Folder deletion must offer the documented safe move-to-Uncategorized behavior versus destructive deletion, with explicit confirmation for deletion of contained bookmarks.
- Confirm bulk destructive actions and library replacement imports.
- Never make a destructive action happen because a user tapped a card or an ambiguous menu item.
- Keep one clear primary action in dialogs and use consistent cancel/back behavior.

---

## 8. Private-folder security requirements

Private folders are security-sensitive. Treat this section as mandatory even if the current task only touches search, preview images, backup, or UI.

- Do not implement a “private” mode by merely conditionally hiding cards.
- Do not return private records from ordinary repository methods while no valid private session exists.
- Gate private reads and writes behind an explicit authenticated private-session boundary.
- Use verified database-at-rest encryption (for example, SQLCipher in a compatible native build) if required by the security design. Verify the actual generated Android binary and stored database; configuration alone is not evidence of encryption.
- Encrypt private preview images and other private filesystem assets separately. Database encryption does not encrypt standalone image files.
- Store key material using Android Keystore-backed secure mechanisms. Do not put encryption keys, recovery secrets, or PINs in AsyncStorage, ordinary preferences, source code, or logs.
- Never use a user PIN directly as the database encryption key or store the PIN in plaintext. Use a reviewed key-derivation and key-wrapping design.
- Biometric authentication must be paired with a secure fallback using the documented device credential / PIN behavior. Handle unavailable biometrics, cancelled prompts, enrollment changes, lockouts, and device credential fallback.
- If biometric authentication must release a cryptographic key, verify that the key-release operation is actually bound to the required Android authentication policy. A cosmetic biometric prompt is not sufficient.
- Keep authenticated private-session state short-lived and in memory. Lock on the documented lifecycle/timeout events.
- Clear private UI state and cached references when the session locks or expires. Prevent stale components from displaying private content after lock.
- Protect private content in Android recent-app/task-switcher snapshots while it is visible, according to the security design.
- Exclude private information from analytics, logs, crash breadcrumbs, debug output, clipboard previews, notifications, and unprotected search indexes.
- Do not show private preview images on Home or any public surface while locked.
- Do not claim production-grade private-folder security until the full native key, database, image-file, lifecycle, search, backup, and app-switcher behavior has been tested on an Android build.
- If a required cryptographic/native capability cannot be implemented or verified safely, stop and report the gap. Do not silently ship a weaker substitute.

---

## 9. Error handling, resilience, and logging

### 9.1 Errors must be handled at the correct boundary

- Core services and repositories should expose predictable typed failures or a consistent project error convention.
- Repositories must not display alerts, snackbars, or screen-specific text.
- Feature operations/hooks should convert low-level errors into meaningful feature states where appropriate.
- Screens should present errors through shared UI components and user-understandable language.
- Preserve the original error as a cause or diagnostic detail when safe; do not expose raw native stack traces to users.
- Do not silently catch and ignore errors.
- Do not use an empty catch block, return fake success, or substitute empty data when the operation actually failed.
- If an operation can partially succeed, make its state explicit and provide a recovery path.

### 9.2 Required graceful-degradation behavior

| Condition                                      | Required behavior                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Device offline while saving                    | Persist the valid URL locally; continue without metadata.                            |
| Metadata endpoint blocks requests or times out | Keep the bookmark and show the fallback preview.                                     |
| No usable preview image                        | Use designed fallback artwork with available metadata.                               |
| Broken or removed cached image                 | Replace with fallback and safely retry/clean up as appropriate.                      |
| Duplicate URL                                  | Follow the product's duplicate flow; do not silently overwrite an existing bookmark. |
| Invalid shared payload                         | Show a clear recoverable validation state; do not crash.                             |
| Database or filesystem failure                 | Show a useful error; do not claim the save/import/delete succeeded.                  |
| Authentication cancelled or unavailable        | Keep private content locked and offer only the documented fallback path.             |
| Backup invalid or unsupported                  | Reject before modifying the library and explain the issue.                           |
| Import interrupted                             | Preserve the previous valid library and recover from staged/transactional import.    |

### 9.3 Logging rules

- Never log bookmark titles, full URLs, query parameters, notes, folder names where sensitive, private IDs that expose content relationships, authentication secrets, PINs, keys, or backup contents.
- Sanitize network errors and metadata-extraction diagnostics. URLs can contain private tokens and tracking parameters.
- Do not add a remote logging or telemetry service without approval.
- Keep development diagnostics useful but remove noisy temporary logs before completion.
- Do not commit secrets, `.env` values, API keys, signing files, keystores, or local credentials. Ensure secrets are excluded from version control.

---

## 10. Testing requirements

Tests are part of implementation, not an optional final step. Add or update tests for every behavior change, especially persistence, security, imports, and user-visible state transitions.

### 10.1 Test layers

Use the test tools already configured in the repository. The expected coverage layers are:

1. **Unit tests:** URL validation, metadata parsing, normalization, ordering, backup validation, search helpers, security-state decisions, and other pure logic.
2. **Repository / integration tests:** SQLite queries, constraints, migrations, transactions, file lifecycle, import/export, search filtering, and persistence after reopening the database.
3. **Component tests:** bookmark fallback states, folder cards, dialogs, form validation, navigation states, authentication errors, empty/loading/error states, and accessibility labels.
4. **Android end-to-end tests:** real share intent, navigation/back behavior, saving offline, folder operations, private-folder lock/unlock, and backup flows on a development/native build.

### 10.2 Minimum feature test expectations

- A valid URL is saved even when metadata retrieval fails or the device is offline.
- Invalid schemes and malformed URLs are rejected safely.
- A bookmark always renders either a real preview or a designed fallback.
- Folder creation, rename, move, and deletion follow the documented behavior.
- Deleting a folder never unexpectedly deletes bookmarks.
- Home contains recent folders plus a four-item recently saved preview, with correct ordering.
- Home does not render Search or a See All action for folders; its preview is limited to four public bookmarks.
- Folders opens the complete collection; Search is reached from Folders and is not a tab.
- Search results are local and exclude private records while locked.
- Private bookmark metadata, preview assets, and search terms do not leak through public queries or UI after locking.
- Import validates before mutation and does not corrupt the existing library on failure.
- Export/import preserves supported bookmark and folder relationships.
- Database migrations preserve existing user records.
- Dark and light themes render correctly and maintain readable contrast.
- Android back navigation, keyboard behavior, and share-intent handoff work on an actual Android build.

### 10.3 Performance and quality targets

Validate the targets in the PRD/TRD on a representative mid-range Android device where applicable:

- Search should complete in under **300 ms** for a library of **10,000 bookmarks** under the defined test conditions.
- Lists should be virtualized and remain responsive as the library grows.
- Core saved-library, folder, and search behavior must work offline.
- **100% of saved bookmarks** must have either an image-backed preview or a designed fallback card.
- No private-folder content should be exposed when locked.

Do not fabricate benchmark results. State device, data size, build type, and test conditions for measurements.

### 10.4 Before marking a task complete

Run the relevant checks supported by the repository, such as:

- TypeScript type checking.
- ESLint / repository lint command.
- Formatter check if configured.
- Unit and component tests.
- Database / integration tests.
- `npx expo install --check` and `npx expo-doctor` after Expo dependency/configuration changes.
- Android development build or native build for changes involving native modules, plugins, permissions, manifest, encryption, or share-intent behavior.

Do not say “all tests pass” unless they were actually run and passed. If a required check could not be run, state why and what remains unverified.

---

## 11. Development workflow

For each task, follow this sequence.

### Step 1 — Understand

- Read the relevant product and technical documentation.
- Inspect the relevant implementation and existing tests.
- Identify the requested behavior, affected layers, data changes, native changes, and security implications.
- Check the Git working tree and preserve unrelated user changes.

### Step 2 — Plan narrowly

- Identify the smallest coherent set of files to change.
- Decide which layers own the behavior.
- Identify the tests that will prove the behavior.
- Call out any dependency, native build, schema migration, permission, or security work before broad changes.
- Do not ask the product owner to reconfirm a decision already stated in the project documents.

### Step 3 — Implement

- Reuse existing utilities and components.
- Keep the change focused on the requested behavior.
- Follow the repository conventions and architecture boundaries.
- Add runtime validation at untrusted boundaries.
- Add tests with the implementation.
- Update relevant documentation when contracts change.
- Do not include opportunistic refactors or unrelated style changes.

### Step 4 — Verify

- Run targeted tests first, then relevant wider checks.
- Build the Android app when a change depends on native functionality.
- Inspect the final diff for accidental file deletion, secrets, generated artifacts, lockfile churn, unrelated formatting, or user changes.
- Verify that the implementation still satisfies the product invariants in this file.

### Step 5 — Report

At the end of the task, report:

1. What changed and where.
2. Important implementation decisions or assumptions.
3. Tests, type checks, lint, and builds actually run, with their outcomes.
4. What could not be verified and why.
5. Any migration, native rebuild, or manual setup the developer must perform.
6. Any remaining blocker or product-owner decision required.

Do not claim that a feature is complete based solely on compiling its screen. Include persistence, failure states, privacy, and Android integration where those are part of the feature.

### 11.1 Git and generated files

- Do not discard, reset, overwrite, or reformat unrelated user changes.
- Do not run destructive Git commands such as `reset --hard`, `clean -fd`, or forced checkout as a convenience.
- Do not commit, push, open a pull request, publish a release, or deploy unless explicitly asked.
- Do not commit build outputs, caches, local databases, user backups, credentials, keystores, or machine-specific files.
- Keep generated files and lockfiles only when they are required by the repository's actual workflow.

---

## 12. Changes that require explicit product-owner approval

Do not make any of the following changes without explicit approval, even if the change appears convenient or an AI tool suggests it.

### 12.1 Product scope and navigation

- Changing the app's Android-first / React Native product direction.
- Adding iOS as a supported release target or changing the MVP platform commitment.
- Adding accounts, sign-in, a hosted backend, a remote database, cloud sync, social features, collaboration, AI features, or a subscription/monetization model.
- Changing the three root destinations or their order: Home, Folders, Settings.
- Adding Search or Add to the bottom navigation.
- Moving Search away from the Folders screen's secondary route.
- Adding recent bookmarks beyond the approved four-item Home preview, Search, a full folder list, or a See All action for folders to Home.
- Changing the floating capsule navigation into a full-width edge-attached bar.
- Changing the rule that All Bookmarks and Uncategorized are virtual collections.
- Changing the rule that every saved bookmark needs a visual preview or designed fallback.
- Changing the rule that the user can save a URL when metadata retrieval fails.
- Expanding the app into a full browser, offline reader, or original-media downloader.

### 12.2 Data, security, and privacy

- Replacing SQLite as the source of truth.
- Changing the database schema in a way that loses, rewrites, or makes existing user data incompatible.
- Editing a migration that may already have shipped instead of adding a new migration.
- Changing folder deletion semantics or adding cascading bookmark deletion.
- Weakening private-folder encryption, authentication, key handling, file protection, search isolation, or app-switcher protection.
- Storing keys, PINs, private data, or secrets in a less secure location.
- Exporting private-folder content without the documented protection and explicit user choice.
- Changing the backup file format, versioning, import merge/replace semantics, or recovery strategy.
- Adding telemetry, analytics, crash reporting, advertising, tracking, or remote collection of user data.
- Adding broad Android permissions or changing exported components / intent security beyond the documented feature need.

### 12.3 Framework, dependencies, and visual identity

- Upgrading or downgrading Expo SDK, React Native, React, TypeScript, Node requirements, Hermes, or the Android build toolchain as a broad project change.
- Switching Expo to bare React Native or bare React Native to Expo.
- Replacing the package manager or lockfile.
- Adding a foundational UI kit, state manager, ORM, networking stack, or cryptography package.
- Changing the app name, Android application ID, signing identity, package identity, or release configuration.
- Replacing Paperclip's design system, brand palette, typography, icon family, floating navigation treatment, or Material 3 Expressive direction.

### 12.4 What to do when approval is needed

Do not block unrelated safe work. Complete work that does not depend on the proposed change, then provide:

- The current documented behavior.
- The reason a change appears necessary.
- The user-visible, technical, security, migration, and maintenance impact.
- At least one lower-impact alternative where feasible.
- The exact decision or approval required.

Wait for approval before implementing the protected change.

---

## 13. Definition of done

A task is done only when all applicable items below are satisfied:

- [ ] The requested behavior matches the PRD, user flows, UI/UX specification, design system, and this file.
- [ ] The implementation fits the existing repository and does not introduce unnecessary dependencies or architecture.
- [ ] TypeScript types and runtime validation are correct at external boundaries.
- [ ] Persistence, filesystem operations, and migrations preserve user data.
- [ ] Private data remains protected across UI, repositories, search, assets, backups, logs, and app lifecycle where relevant.
- [ ] Loading, empty, offline, failure, fallback, and success states are handled where applicable.
- [ ] The UI uses shared Paperclip tokens and accessible React Native components.
- [ ] Automated tests cover the changed behavior and important failure cases.
- [ ] Relevant type, lint, test, and Android build checks have been run and their results recorded.
- [ ] Documentation has been updated when the contract or setup changed.
- [ ] The final diff contains no unrelated refactor, accidental user-data deletion, secrets, or unexplained generated-file churn.
- [ ] The completion report clearly separates verified behavior from assumptions and unverified work.

**When in doubt, preserve user data, preserve the written product contract, choose the smallest safe implementation, and ask before changing a protected decision.**

# Paperclip — AI Coding Agent Instructions

**Document:** `AGENTS.md`  
**Product:** Paperclip — Android link and article saver  
**Applies to:** Every AI coding agent, coding assistant, automated refactoring tool, and human contributor working in this repository  
**Status:** Project implementation contract  
**Last updated:** 2 November 2026

---

## 1. Mission and non-negotiable principles

You are implementing **Paperclip**, an Android-first, local-first app for saving links from Instagram, YouTube, Reddit, browsers, and other apps; viewing visual previews; organizing saved links into folders; protecting private folders; searching the local library; and importing/exporting the user's data.

Your job is to implement the product described by the project documents—not to reinterpret the product, invent extra features, or redesign the architecture while completing an unrelated task.

Follow these principles in every change:

1. **Preserve user data.** Never perform a destructive database, filesystem, import, or migration operation without a safe and tested path.
2. **Local-first.** SQLite is the source of truth for bookmarks and folders. Core library operations must work offline. No account, hosted backend, or cloud sync is part of the MVP.
3. **Privacy is a security property.** A private folder is not secure merely because the UI hides it. Enforce privacy at storage, repository, search, asset, logging, and app-switcher boundaries.
4. **Save before enriching.** A valid URL must be saved even when the device is offline or metadata extraction fails. Preview retrieval must never be a prerequisite for saving.
5. **Visual-first library.** Every saved bookmark must render as a designed preview card or a polished fallback card. Never make a raw URL-only row the normal bookmark presentation.
6. **Native Android quality.** Respect Android navigation, safe areas, accessibility, permissions, system back behavior, and Material 3 Expressive design intent.
7. **Small, understandable engineering.** Prefer the simplest architecture and smallest dependency set that safely meets the requirements. Do not add layers, libraries, abstractions, or configuration without a concrete need.
8. **Verify, do not assume.** Inspect the actual repository, build configuration, and installed package versions before changing them. Run the relevant checks and report what was and was not verified.

Do not treat an instruction to implement a feature as permission to change product scope, security guarantees, app identity, native configuration, or existing user data.

---

## 2. Project specification and source-of-truth order

Read the relevant project documents before implementing or modifying a feature. They are intended to be used together.

| Document                                    | Authority / purpose                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Paperclip_PRD.md`                          | Product goals, scope, user stories, feature requirements, priorities, and acceptance criteria.                           |
| `Paperclip_TRD.md`                          | Technical baseline, recommended stack, architecture, native integrations, security, backup, and implementation guidance. |
| `Folder Structure and Code Architecture.md` | Module responsibilities, boundaries, code organization, and feature implementation patterns.                             |
| `DATABASE_SCHEMA.md`                        | SQLite entities, relationships, constraints, indexes, migrations, and data-integrity rules.                              |
| `USER_FLOWS.md`                             | Expected user journeys, navigation behavior, validation, and UI states.                                                  |
| `UI_UX_SPECIFICATION.md`                    | Screen composition, navigation behavior, and interaction requirements.                                                   |
| `DESIGN_SYSTEM.md`                          | Visual tokens, typography, color, shapes, spacing, iconography, and reusable component guidance.                         |
| Figma design file                           | Visual exploration and screen reference; it does not override the written product or accessibility requirements.         |

### 2.1 How to resolve conflicts

- Follow the **current written product decisions** in the PRD, TRD, user flows, UI/UX specification, and design system.
- Use the database schema for persistence behavior and the TRD / architecture document for technical boundaries.
- Use the Figma file as a visual reference, not as permission to revive an older product decision. Some visual explorations may show earlier navigation. Where a Figma screen conflicts with the current written navigation contract, follow the written contract.
- If two written documents materially contradict each other, do not silently choose whichever is easier to implement. Identify the exact conflict, explain its impact, and ask for a product-owner decision before making an irreversible or user-visible choice.
- If implementation reality requires a change to a documented requirement, stop at the smallest safe boundary, explain the constraint and alternatives, and request approval. Do not quietly weaken the requirement.

### 2.2 Confirmed product contract

These decisions are fixed unless the product owner explicitly changes them:

- Android application; React Native implementation.
- Expo + TypeScript is the preferred baseline unless the existing repository already has a sound alternative configuration. Inspect before changing it.
- Material 3 Expressive is the design direction, implemented with real React Native components and verified native integrations—not screenshots used as UI.
- Exactly three top-level destinations: **Home**, **Folders**, and **Settings**.
- The primary navigation is a **floating capsule-style bottom bar**, not a conventional full-width bar attached to the bottom edge.
- **Home shows recent folders plus a recently saved preview.** Show up to six recent folders by `lastOpenedAt` order (with the documented fallback for folders that have never been opened) and up to four recently saved public bookmarks with a “View all” action. Home does not show a search field, the full folder catalogue, or a See All action for folders. (Product-owner decision, 3 November 2026.)
- **Folders** is the full folder-library destination. It provides access to all user-created folders, All Bookmarks, Uncategorized, and the Search entry point.
- **Search is a secondary route**, opened from the search action in the Folders screen. It is not a bottom-navigation item.
- Settings contains app preferences, appearance, private-folder/security controls, and backup/import-export entry points as specified by the product documents.
- The Add Link action is a separate floating action; it is not a navigation destination.
- No mandatory account, sign-in, remote database, hosted backend, or cloud sync for the MVP.
- Paperclip stores URLs, metadata, and locally cached preview assets. It does not download or rehost original Instagram posts, YouTube videos, or full platform content.
- A bookmark can be saved even without metadata, an image, or an internet connection.
- Private-folder contents must be inaccessible through normal UI, repository queries, search, app previews, logs, and unprotected local files while locked.

---

## 3. Mandatory repository inspection before coding

Before the first code change in a task, inspect the repository. Do not assume that the project is empty or that the proposed documents describe the repository's current state.

At minimum, inspect:

- `package.json` and the actual package manager lockfile.
- Expo SDK, React Native, React, TypeScript, and Node compatibility.
- `app.json`, `app.config.ts`, Expo config plugins, and relevant environment configuration.
- Existing `app/`, `src/`, and `android/` structure, including whether native Android files are generated or maintained directly.
- Existing navigation, theme, database, storage, and test implementations.
- Git status and recent changes, so you do not overwrite unfinished user work.
- Existing scripts for linting, formatting, type checking, tests, and Android builds.

Then:

1. Identify the smallest relevant implementation area.
2. Reuse existing conventions and components where they are sound.
3. Compare existing behavior with the relevant product acceptance criteria.
4. State any important assumptions or blockers before making a broad change.
5. Make focused changes; do not recreate the app or reorganize unrelated files.

**Never blindly upgrade Expo, React Native, React, Node tooling, or native dependencies.** The TRD's version table is a compatibility baseline, not permission to replace working versions in the repository. Check installed versions and the current Expo compatibility matrix first. For Expo-managed packages, prefer `npx expo install` over an arbitrary package version. Keep the lockfile consistent with the package manager already in use.

---

## 4. Coding standards

### 4.1 TypeScript and JavaScript

- Use TypeScript for application code. Keep strict type checking enabled.
- Prefer explicit, useful domain types and narrow function signatures.
- Avoid `any`. If an untyped third-party boundary makes it unavoidable, isolate it, add a comment explaining why, validate the value, and convert it to a safe internal type immediately.
- Use `unknown` rather than `any` for untrusted external values.
- Validate data entering from Android share intents, deep links, network responses, file imports, route parameters, and native modules.
- Do not use unsafe type assertions to silence errors. Narrow types through validation or correct the underlying type.
- Keep functions small and cohesive. Extract a helper when it gives a meaningful name to non-trivial logic or removes real duplication—not merely to reduce line count.
- Use `async` / `await` and explicit error paths for asynchronous work.
- Avoid hidden side effects in render functions, getters, and utility functions.
- Do not use `useEffect` to mirror values that can be derived during render or to coordinate ordinary event-driven actions.
- Clean up subscriptions, listeners, timers, and abortable requests when their owner unmounts or the operation is superseded.

### 4.2 Naming and formatting

Follow the repository's formatter and lint configuration. Do not introduce a second formatting or linting system.

Use these conventions unless the existing repository has a consistent established alternative:

- `PascalCase` for React components and component files.
- `camelCase` for functions, variables, hooks, and object properties.
- `UPPER_SNAKE_CASE` for true module-level constants.
- Prefix custom hooks with `use`.
- Name booleans so their meaning is clear (`isPrivate`, `hasPreview`, `isLoading`).
- Use descriptive names tied to Paperclip's domain (`bookmark`, `folder`, `previewMetadata`) rather than vague names (`data`, `item`, `value`) when the context is not obvious.
- Keep one primary component per file where that improves readability; small tightly related private subcomponents may remain together.
- Avoid unexplained abbreviations and misleading names.

### 4.3 React Native practices

- Use React Native primitives and the approved design-system components.
- Use `StyleSheet.create` or the styling convention already established by the project. Do not introduce a new styling library for one component.
- Keep UI components focused on presentation and interaction. Move persistence, network extraction, cryptography, and complex business rules out of component bodies.
- Use stable keys for rendered collections.
- Avoid unnecessary renders and expensive work in render paths. Memoize only after identifying a meaningful performance reason.
- Use `FlatList` or an appropriate virtualized list for collections that can grow. Do not render thousands of bookmarks in a single unvirtualized `ScrollView`.
- Respect Android Back behavior, keyboard behavior, status/navigation bars, edge-to-edge insets, and device safe areas.
- Never rely on web-only APIs or browser globals in React Native code unless an explicitly installed and compatible runtime/polyfill provides them.

### 4.4 Comments and documentation

- Write comments to explain non-obvious reasoning, security assumptions, compatibility workarounds, or important invariants.
- Do not narrate obvious code line by line.
- Update documentation when a change alters a documented contract, schema, setup step, or developer workflow.
- Do not claim that an integration is secure, encrypted, offline-capable, or tested unless the corresponding implementation and verification exist.

---

## 5. Framework and library restrictions

### 5.1 Preferred platform baseline

- Android is the MVP platform.
- React Native is the application framework.
- Prefer Expo and Expo Router when compatible with the existing project.
- Use TypeScript.
- Use Hermes unless a verified compatibility issue requires a change.
- Use a custom Expo development build / native Android build for features requiring native modules, config plugins, Android Sharesheet registration, SQLCipher, or Android Keystore integration. Expo Go is suitable only for limited early UI experiments and is not the acceptance environment for the complete app.

### 5.2 Recommended libraries are optional, not a shopping list

The TRD lists candidate packages for routing, SQLite, files, secure storage, biometrics, share intents, image rendering, input validation, HTML parsing, and testing. Add a package only when the current task requires it and its compatibility has been checked.

Potential choices include:

- Expo Router for navigation.
- `expo-sqlite` for SQLite persistence and migrations.
- Verified SQLCipher support for database-at-rest encryption.
- `expo-file-system` for app-managed preview and backup files.
- `expo-image` for local image rendering, caching, and placeholders.
- `expo-secure-store` for small secrets or wrapped key material—not as the bookmark database.
- `expo-local-authentication` for supported biometric prompts, with a verified key-release design for protected data.
- A compatible share-intent integration for Android incoming shares.
- `expo-sharing` / React Native Share API for outgoing sharing.
- `expo-document-picker` for selecting backup files.
- Zod or an equivalent lightweight runtime validator at untrusted input boundaries.
- Jest, React Native Testing Library, and Maestro or Detox for tests.

These names are options, not authorization to install all of them. Confirm the package's current maintenance state, Expo SDK compatibility, Android support, New Architecture support where relevant, and license before adoption.

### 5.3 Dependency rules

Before adding or changing a dependency:

1. Check whether the capability already exists in the project or can be implemented safely with the platform APIs already present.
2. Explain the concrete gap the dependency fills.
3. Verify compatibility with the installed Expo / React Native versions and Android build setup.
4. Prefer a maintained, focused package with a small transitive dependency footprint.
5. Add it through the repository's existing package manager and commit/update the lockfile as appropriate.
6. Run the relevant dependency, type, test, and native build checks.

Do NOT:

- Install a library just because it is popular or appears in a tutorial.
- Add multiple libraries that solve the same problem.
- Add a state-management library by default. React hooks and feature hooks are sufficient unless cross-screen transient state demonstrates a real need. Zustand is a possible small-store option, not a requirement.
- Add a backend-oriented data-fetching/cache library to access local SQLite data.
- Add an ORM solely for fashion or abstraction. Use parameterized SQLite queries unless an ORM materially improves the implementation and is verified with the selected SQLCipher setup.
- Add a large UI kit without first checking whether it satisfies the design, accessibility, native behavior, and compatibility requirements.
- Treat React Native Paper as a complete implementation of every Material 3 Expressive component. Evaluate its actual supported components and implement missing behavior deliberately.
- Add analytics, advertising, crash-reporting telemetry, remote configuration, cloud storage, authentication providers, or network sync without explicit approval and a privacy review.
- Add WebViews, browser automation, or page JavaScript execution to scrape original platform content.
- Use unpinned `latest`, nightly, canary, alpha, or release-candidate packages in a production path without explicit approval and compatibility testing.
- Change package managers or replace the lockfile without explicit approval.

### 5.4 Native project and permissions

- Prefer Expo config plugins and Continuous Native Generation when they can express a native change reliably.
- Do not make manual edits to generated native files that will be lost on regeneration. If direct native maintenance is already part of the repository, follow its established approach.
- Explain why each Android permission is needed. Request the narrowest possible permission and only at the point where it is needed.
- Do not request broad storage access when the Storage Access Framework / document picker can provide a user-selected file.
- Do not add accessibility, notification, contacts, location, camera, microphone, or other unrelated permissions.
- Do not alter application ID, signing configuration, keystore, intent filters, exported components, target SDK, or manifest security settings without approval, except for a narrowly scoped feature implementation that is already explicitly specified and can be safely reviewed.

---

## 6. Architecture rules

### 6.1 Keep architecture proportional

Use the feature-oriented structure described in `Folder Structure and Code Architecture.md`. Adapt it to the repository instead of forcing a large reorganization.

Conceptual dependency direction:

```text
Routes / Screens / Components
             |
       Feature hooks
             |
       Feature operations
             |
        Repositories
          /     \
      SQLite   File store
          \     /
       Core services / native bridges
```

The implementation may use fewer layers when a feature is simple. Do not create an interface, factory, service, adapter, provider, or abstraction unless it has a clear role, boundary, or testability benefit.

### 6.2 Responsibility boundaries

- **`app/`:** route declarations, layouts, route parameters, and navigation configuration. Keep route files thin.
- **`features/`:** product capabilities and their screens, feature-specific components, hooks, validation, and operations.
- **`core/`:** shared infrastructure such as database connection/migrations, filesystem, security/key management, metadata retrieval, share-intent integration, backup archive handling, and platform bridges.
- **`shared/`:** generic UI building blocks and genuinely shared utilities.
- **`theme/`:** semantic design tokens, themes, and component styling foundations.

Follow the actual repository's names if it already has an equivalent structure. Do not move files across the repository just to match this example.

### 6.3 Data ownership and repositories

- SQLite is the single source of truth for bookmark, folder, and persisted settings data.
- Preview images and other binary assets belong in app-managed filesystem storage; store their paths and relevant metadata in SQLite.
- UI components must not execute SQL directly.
- Put SQL and persistence operations behind a small set of repositories or query modules.
- Use parameterized SQL for every value originating from user input or external data.
- Keep repository methods focused on domain operations, not presentation decisions.
- Use stable IDs for folders and bookmarks. Do not use array indices as record identifiers.
- Use transactions for multi-step changes that must succeed or fail together.
- Avoid holding duplicate full copies of bookmark/folder data in AsyncStorage, a global store, or another persistence layer.
- Local view state may live in React state. Cross-screen transient state may use a small store only when justified.

### 6.4 Folder and bookmark invariants

- `folder_id = NULL` means Uncategorized.
- All Bookmarks is a virtual collection, not a real database folder row.
- Uncategorized is a virtual collection, not a real database folder row.
- A bookmark belongs to zero or one user-created folder.
- Deleting a folder must never silently cascade-delete its bookmarks. Present the documented user choice and perform the selected behavior transactionally.
- Moving a bookmark changes its folder association; it must not create an accidental duplicate.
- Opening a folder updates `last_opened_at` after a successful open.
- Home's recent-folder query returns folders only, ordered by `last_opened_at` descending, with the documented fallback for folders without an open timestamp.
- Do not build a separate hard-coded data source for Home. Query the same canonical folder repository.

### 6.5 Metadata retrieval and preview pipeline

- Saving a URL and retrieving its metadata are separate operations.
- Persist a valid URL and a provisional bookmark before starting or awaiting network enrichment.
- Metadata extraction must be bounded by timeouts, response-size limits, allowed content types, and safe redirect handling.
- Accept only supported `http` and `https` URLs. Reject malformed or unsupported schemes such as `javascript:`, `file:`, and arbitrary intent schemes unless an explicit, reviewed handler exists.
- Do not execute remote page JavaScript to obtain metadata.
- Do not download, rehost, or claim offline availability of the original post, video, or full article.
- Treat page metadata, image URLs, redirects, and share-intent strings as untrusted input.
- Protect the app from requests to localhost, private, loopback, link-local, and other prohibited destinations. Validate redirects as well as the initial URL. If the React Native networking stack cannot enforce the necessary destination/redirect policy, use a reviewed native-safe approach or document a blocker; do not claim SSRF protection without tests.
- A blocked platform, absent Open Graph tags, broken image, timeout, or offline device must result in a useful fallback card—not a failed save.
- Preserve the user-submitted URL separately from a discovered canonical URL when the data model requires both.
- Avoid refetching metadata unnecessarily. Respect stored preview status and provide bounded retry behavior.

### 6.6 Search

- Search is local and must work without a network connection.
- Search the fields defined by the PRD and UI specifications, including relevant title, URL/domain, description, notes, and folder name.
- Use the database search/index strategy documented in the TRD and schema. Verify optional FTS support in the actual Android build before depending on it.
- Filter locked private records at the repository/query boundary. A UI filter alone is insufficient.
- A normal search query, suggestion, result count, empty state, or recent-query list must not leak private titles, URLs, notes, domains, or thumbnails while locked.
- Preserve a back path to Folders. Search is not a tab.
- Keep search responsive for the documented target library of at least 10,000 bookmarks; profile actual devices rather than assuming performance.

### 6.7 Import and export

- Treat backup files as untrusted input.
- Validate archive structure, manifest version, field types, IDs, relationships, asset references, file sizes, and supported schema versions before modifying the library.
- Reject path traversal / zip-slip entries, suspicious archive expansion, malformed JSON, unsupported versions, and oversized payloads safely.
- Do not partially replace the user's library if validation fails.
- Make import behavior explicit: merge/skip/replace semantics must match the product specification and user confirmation.
- Use a transaction or staged import so a failed import can be rolled back without corrupting existing data.
- Preserve relationships and supported metadata. Do not silently discard unknown data that the versioning strategy says must be retained or rejected.
- Private data included in backups must be protected according to the backup security specification. Do not export private content in plaintext under the guise of an ordinary backup.
- Do not change the backup format or versioning contract without approval.

---

## 7. UI implementation rules

### 7.1 Use the design system

- Read `DESIGN_SYSTEM.md` and `UI_UX_SPECIFICATION.md` before implementing or restyling screens.
- Use centralized semantic tokens for color, typography, shape, spacing, elevation, icons, and motion.
- Do not scatter raw hex colors, arbitrary font sizes, corner radii, shadows, or spacing values through feature components.
- Support light and dark themes. Support Android dynamic color where it is available and reliable, with the designed Paperclip palette as a fallback.
- Use one consistent icon family. Do not mix unrelated icon libraries or emoji as substitutes for functional icons.
- Build actual accessible React Native components. Do not use a flattened screenshot, exported Figma frame, or image of a UI as the screen implementation.
- Use the Figma file for visual hierarchy and composition, but follow the current written navigation and product requirements when a mockup is stale.

### 7.2 Navigation contract

Implement exactly these root destinations:

1. **Home**
2. **Folders**
3. **Settings**

The bottom navigation must be a floating capsule with clear separation from the screen edge and content. It must not become a full-width, edge-attached conventional tab bar.

- Do not add Search or Add as navigation destinations.
- Search opens from the action in the Folders top app bar and is a secondary route.
- Save Link, Search, Folder Details, Bookmark Details, Private Folder Unlock, and focused import/backup flows should hide the floating bar unless a documented and tested hierarchy specifically requires otherwise.
- The Add Link floating action is separate from navigation and must not overlap the floating capsule, system navigation area, or important content.
- Preserve Android back-stack and system-back behavior.

### 7.3 Home screen: recent folders and recently saved

Home has a strict content contract:

- Display a heading such as “Recent folders”.
- Display up to six recent folder cards, ordered by the most recently opened folders first.
- For folders that have never been opened, use the fallback ordering specified in the PRD / TRD / database schema.
- Locked folders may appear as protected folder entries with a lock indicator, but must not reveal bookmark titles, notes, URLs, or preview images.
- Show an appropriate Create Folder empty state when there are no folders.
- Show up to four recently saved public bookmarks in a “Recently saved” preview with a “View all” action (product-owner decision, 3 November 2026). Locked private content must never appear in this preview.
- Do **not** show a bookmark feed beyond the four-item preview, a search field, search results, the entire folder catalogue, or a “See All” action for folders on Home.

The full collection belongs on Folders.

### 7.4 Folders, bookmark cards, and Search

- Folders displays the complete user-created folder collection and the documented All Bookmarks / Uncategorized entry points.
- Private folder entries can show that they are locked, but their contents remain hidden until authentication succeeds.
- Every bookmark must have a visual card. Use the best available local preview image and metadata; otherwise use a consistent branded fallback with available title/domain/source information.
- Support the specified grid and list presentation variants where required by the current design and screen context.
- Do not show a broken-image icon, empty image hole, or a raw URL as the only visual content.
- Search results use the same bookmark card system and never expose locked private content.
- Empty, loading, offline, metadata-pending, missing-image, no-results, and error states must be deliberately designed. Do not leave screens blank while a query or image is loading.

### 7.5 Interaction, accessibility, and responsive behavior

- Follow Android interaction conventions and the Material 3 Expressive intent in the design system.
- Interactive controls need visible pressed, focused, selected, disabled, loading, and error states where applicable.
- Use touch targets of at least 48dp for primary interactive elements unless a platform convention or documented accessibility rationale specifies otherwise.
- Provide accessible labels and roles for icon-only buttons, FABs, navigation items, and custom controls.
- Support TalkBack, screen-reader focus order, meaningful content descriptions, and Android font scaling.
- Maintain sufficient color contrast in both themes. Never communicate a critical state using color alone.
- Respect keyboard appearance, input focus, text selection, and form submission behavior.
- Respect system reduced-motion preferences. Motion should clarify hierarchy or state change, not delay routine actions.
- Handle narrow and large Android screens, landscape where applicable, and safe-area/edge-to-edge insets.
- Use skeletons or placeholders only when they improve continuity; do not create misleading placeholder content that looks saved when it is not.

### 7.6 Dialogs, sheets, and destructive actions

- Use shared dialog and bottom-sheet patterns from the design system.
- Explain destructive consequences in plain language.
- Folder deletion must offer the documented safe move-to-Uncategorized behavior versus destructive deletion, with explicit confirmation for deletion of contained bookmarks.
- Confirm bulk destructive actions and library replacement imports.
- Never make a destructive action happen because a user tapped a card or an ambiguous menu item.
- Keep one clear primary action in dialogs and use consistent cancel/back behavior.

---

## 8. Private-folder security requirements

Private folders are security-sensitive. Treat this section as mandatory even if the current task only touches search, preview images, backup, or UI.

- Do not implement a “private” mode by merely conditionally hiding cards.
- Do not return private records from ordinary repository methods while no valid private session exists.
- Gate private reads and writes behind an explicit authenticated private-session boundary.
- Use verified database-at-rest encryption (for example, SQLCipher in a compatible native build) if required by the security design. Verify the actual generated Android binary and stored database; configuration alone is not evidence of encryption.
- Encrypt private preview images and other private filesystem assets separately. Database encryption does not encrypt standalone image files.
- Store key material using Android Keystore-backed secure mechanisms. Do not put encryption keys, recovery secrets, or PINs in AsyncStorage, ordinary preferences, source code, or logs.
- Never use a user PIN directly as the database encryption key or store the PIN in plaintext. Use a reviewed key-derivation and key-wrapping design.
- Biometric authentication must be paired with a secure fallback using the documented device credential / PIN behavior. Handle unavailable biometrics, cancelled prompts, enrollment changes, lockouts, and device credential fallback.
- If biometric authentication must release a cryptographic key, verify that the key-release operation is actually bound to the required Android authentication policy. A cosmetic biometric prompt is not sufficient.
- Keep authenticated private-session state short-lived and in memory. Lock on the documented lifecycle/timeout events.
- Clear private UI state and cached references when the session locks or expires. Prevent stale components from displaying private content after lock.
- Protect private content in Android recent-app/task-switcher snapshots while it is visible, according to the security design.
- Exclude private information from analytics, logs, crash breadcrumbs, debug output, clipboard previews, notifications, and unprotected search indexes.
- Do not show private preview images on Home or any public surface while locked.
- Do not claim production-grade private-folder security until the full native key, database, image-file, lifecycle, search, backup, and app-switcher behavior has been tested on an Android build.
- If a required cryptographic/native capability cannot be implemented or verified safely, stop and report the gap. Do not silently ship a weaker substitute.

---

## 9. Error handling, resilience, and logging

### 9.1 Errors must be handled at the correct boundary

- Core services and repositories should expose predictable typed failures or a consistent project error convention.
- Repositories must not display alerts, snackbars, or screen-specific text.
- Feature operations/hooks should convert low-level errors into meaningful feature states where appropriate.
- Screens should present errors through shared UI components and user-understandable language.
- Preserve the original error as a cause or diagnostic detail when safe; do not expose raw native stack traces to users.
- Do not silently catch and ignore errors.
- Do not use an empty catch block, return fake success, or substitute empty data when the operation actually failed.
- If an operation can partially succeed, make its state explicit and provide a recovery path.

### 9.2 Required graceful-degradation behavior

| Condition                                      | Required behavior                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Device offline while saving                    | Persist the valid URL locally; continue without metadata.                            |
| Metadata endpoint blocks requests or times out | Keep the bookmark and show the fallback preview.                                     |
| No usable preview image                        | Use designed fallback artwork with available metadata.                               |
| Broken or removed cached image                 | Replace with fallback and safely retry/clean up as appropriate.                      |
| Duplicate URL                                  | Follow the product's duplicate flow; do not silently overwrite an existing bookmark. |
| Invalid shared payload                         | Show a clear recoverable validation state; do not crash.                             |
| Database or filesystem failure                 | Show a useful error; do not claim the save/import/delete succeeded.                  |
| Authentication cancelled or unavailable        | Keep private content locked and offer only the documented fallback path.             |
| Backup invalid or unsupported                  | Reject before modifying the library and explain the issue.                           |
| Import interrupted                             | Preserve the previous valid library and recover from staged/transactional import.    |

### 9.3 Logging rules

- Never log bookmark titles, full URLs, query parameters, notes, folder names where sensitive, private IDs that expose content relationships, authentication secrets, PINs, keys, or backup contents.
- Sanitize network errors and metadata-extraction diagnostics. URLs can contain private tokens and tracking parameters.
- Do not add a remote logging or telemetry service without approval.
- Keep development diagnostics useful but remove noisy temporary logs before completion.
- Do not commit secrets, `.env` values, API keys, signing files, keystores, or local credentials. Ensure secrets are excluded from version control.

---

## 10. Testing requirements

Tests are part of implementation, not an optional final step. Add or update tests for every behavior change, especially persistence, security, imports, and user-visible state transitions.

### 10.1 Test layers

Use the test tools already configured in the repository. The expected coverage layers are:

1. **Unit tests:** URL validation, metadata parsing, normalization, ordering, backup validation, search helpers, security-state decisions, and other pure logic.
2. **Repository / integration tests:** SQLite queries, constraints, migrations, transactions, file lifecycle, import/export, search filtering, and persistence after reopening the database.
3. **Component tests:** bookmark fallback states, folder cards, dialogs, form validation, navigation states, authentication errors, empty/loading/error states, and accessibility labels.
4. **Android end-to-end tests:** real share intent, navigation/back behavior, saving offline, folder operations, private-folder lock/unlock, and backup flows on a development/native build.

### 10.2 Minimum feature test expectations

- A valid URL is saved even when metadata retrieval fails or the device is offline.
- Invalid schemes and malformed URLs are rejected safely.
- A bookmark always renders either a real preview or a designed fallback.
- Folder creation, rename, move, and deletion follow the documented behavior.
- Deleting a folder never unexpectedly deletes bookmarks.
- Home contains recent folders plus a four-item recently saved preview, with correct ordering.
- Home does not render Search or a See All action for folders; its preview is limited to four public bookmarks.
- Folders opens the complete collection; Search is reached from Folders and is not a tab.
- Search results are local and exclude private records while locked.
- Private bookmark metadata, preview assets, and search terms do not leak through public queries or UI after locking.
- Import validates before mutation and does not corrupt the existing library on failure.
- Export/import preserves supported bookmark and folder relationships.
- Database migrations preserve existing user records.
- Dark and light themes render correctly and maintain readable contrast.
- Android back navigation, keyboard behavior, and share-intent handoff work on an actual Android build.

### 10.3 Performance and quality targets

Validate the targets in the PRD/TRD on a representative mid-range Android device where applicable:

- Search should complete in under **300 ms** for a library of **10,000 bookmarks** under the defined test conditions.
- Lists should be virtualized and remain responsive as the library grows.
- Core saved-library, folder, and search behavior must work offline.
- **100% of saved bookmarks** must have either an image-backed preview or a designed fallback card.
- No private-folder content should be exposed when locked.

Do not fabricate benchmark results. State device, data size, build type, and test conditions for measurements.

### 10.4 Before marking a task complete

Run the relevant checks supported by the repository, such as:

- TypeScript type checking.
- ESLint / repository lint command.
- Formatter check if configured.
- Unit and component tests.
- Database / integration tests.
- `npx expo install --check` and `npx expo-doctor` after Expo dependency/configuration changes.
- Android development build or native build for changes involving native modules, plugins, permissions, manifest, encryption, or share-intent behavior.

Do not say “all tests pass” unless they were actually run and passed. If a required check could not be run, state why and what remains unverified.

---

## 11. Development workflow

For each task, follow this sequence.

### Step 1 — Understand

- Read the relevant product and technical documentation.
- Inspect the relevant implementation and existing tests.
- Identify the requested behavior, affected layers, data changes, native changes, and security implications.
- Check the Git working tree and preserve unrelated user changes.

### Step 2 — Plan narrowly

- Identify the smallest coherent set of files to change.
- Decide which layers own the behavior.
- Identify the tests that will prove the behavior.
- Call out any dependency, native build, schema migration, permission, or security work before broad changes.
- Do not ask the product owner to reconfirm a decision already stated in the project documents.

### Step 3 — Implement

- Reuse existing utilities and components.
- Keep the change focused on the requested behavior.
- Follow the repository conventions and architecture boundaries.
- Add runtime validation at untrusted boundaries.
- Add tests with the implementation.
- Update relevant documentation when contracts change.
- Do not include opportunistic refactors or unrelated style changes.

### Step 4 — Verify

- Run targeted tests first, then relevant wider checks.
- Build the Android app when a change depends on native functionality.
- Inspect the final diff for accidental file deletion, secrets, generated artifacts, lockfile churn, unrelated formatting, or user changes.
- Verify that the implementation still satisfies the product invariants in this file.

### Step 5 — Report

At the end of the task, report:

1. What changed and where.
2. Important implementation decisions or assumptions.
3. Tests, type checks, lint, and builds actually run, with their outcomes.
4. What could not be verified and why.
5. Any migration, native rebuild, or manual setup the developer must perform.
6. Any remaining blocker or product-owner decision required.

Do not claim that a feature is complete based solely on compiling its screen. Include persistence, failure states, privacy, and Android integration where those are part of the feature.

### 11.1 Git and generated files

- Do not discard, reset, overwrite, or reformat unrelated user changes.
- Do not run destructive Git commands such as `reset --hard`, `clean -fd`, or forced checkout as a convenience.
- Do not commit, push, open a pull request, publish a release, or deploy unless explicitly asked.
- Do not commit build outputs, caches, local databases, user backups, credentials, keystores, or machine-specific files.
- Keep generated files and lockfiles only when they are required by the repository's actual workflow.

---

## 12. Changes that require explicit product-owner approval

Do not make any of the following changes without explicit approval, even if the change appears convenient or an AI tool suggests it.

### 12.1 Product scope and navigation

- Changing the app's Android-first / React Native product direction.
- Adding iOS as a supported release target or changing the MVP platform commitment.
- Adding accounts, sign-in, a hosted backend, a remote database, cloud sync, social features, collaboration, AI features, or a subscription/monetization model.
- Changing the three root destinations or their order: Home, Folders, Settings.
- Adding Search or Add to the bottom navigation.
- Moving Search away from the Folders screen's secondary route.
- Adding recent bookmarks beyond the approved four-item Home preview, Search, a full folder list, or a See All action for folders to Home.
- Changing the floating capsule navigation into a full-width edge-attached bar.
- Changing the rule that All Bookmarks and Uncategorized are virtual collections.
- Changing the rule that every saved bookmark needs a visual preview or designed fallback.
- Changing the rule that the user can save a URL when metadata retrieval fails.
- Expanding the app into a full browser, offline reader, or original-media downloader.

### 12.2 Data, security, and privacy

- Replacing SQLite as the source of truth.
- Changing the database schema in a way that loses, rewrites, or makes existing user data incompatible.
- Editing a migration that may already have shipped instead of adding a new migration.
- Changing folder deletion semantics or adding cascading bookmark deletion.
- Weakening private-folder encryption, authentication, key handling, file protection, search isolation, or app-switcher protection.
- Storing keys, PINs, private data, or secrets in a less secure location.
- Exporting private-folder content without the documented protection and explicit user choice.
- Changing the backup file format, versioning, import merge/replace semantics, or recovery strategy.
- Adding telemetry, analytics, crash reporting, advertising, tracking, or remote collection of user data.
- Adding broad Android permissions or changing exported components / intent security beyond the documented feature need.

### 12.3 Framework, dependencies, and visual identity

- Upgrading or downgrading Expo SDK, React Native, React, TypeScript, Node requirements, Hermes, or the Android build toolchain as a broad project change.
- Switching Expo to bare React Native or bare React Native to Expo.
- Replacing the package manager or lockfile.
- Adding a foundational UI kit, state manager, ORM, networking stack, or cryptography package.
- Changing the app name, Android application ID, signing identity, package identity, or release configuration.
- Replacing Paperclip's design system, brand palette, typography, icon family, floating navigation treatment, or Material 3 Expressive direction.

### 12.4 What to do when approval is needed

Do not block unrelated safe work. Complete work that does not depend on the proposed change, then provide:

- The current documented behavior.
- The reason a change appears necessary.
- The user-visible, technical, security, migration, and maintenance impact.
- At least one lower-impact alternative where feasible.
- The exact decision or approval required.

Wait for approval before implementing the protected change.

---

## 13. Definition of done

A task is done only when all applicable items below are satisfied:

- [ ] The requested behavior matches the PRD, user flows, UI/UX specification, design system, and this file.
- [ ] The implementation fits the existing repository and does not introduce unnecessary dependencies or architecture.
- [ ] TypeScript types and runtime validation are correct at external boundaries.
- [ ] Persistence, filesystem operations, and migrations preserve user data.
- [ ] Private data remains protected across UI, repositories, search, assets, backups, logs, and app lifecycle where relevant.
- [ ] Loading, empty, offline, failure, fallback, and success states are handled where applicable.
- [ ] The UI uses shared Paperclip tokens and accessible React Native components.
- [ ] Automated tests cover the changed behavior and important failure cases.
- [ ] Relevant type, lint, test, and Android build checks have been run and their results recorded.
- [ ] Documentation has been updated when the contract or setup changed.
- [ ] The final diff contains no unrelated refactor, accidental user-data deletion, secrets, or unexplained generated-file churn.
- [ ] The completion report clearly separates verified behavior from assumptions and unverified work.

**When in doubt, preserve user data, preserve the written product contract, choose the smallest safe implementation, and ask before changing a protected decision.**
