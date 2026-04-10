# PWA Checklist

Review date: 2026-04-10

Goal: close the gap between "installable website" and "feels like a real app".

## Current Status

- [x] Web app manifest is generated in production via `vite-plugin-pwa`.
- [x] Service worker is generated in production and takes control after reload.
- [x] Offline shell works for previously visited routes in production preview.
- [x] Mobile-first shell exists with fixed bottom navigation and full-screen flows.
- [x] Some offline-first data behavior exists through Dexie caches and queued mutations.
- [x] Local dev one-click auth works on the dev server and redirects to `/groups`.

## Must-Have

- [x] Add real app icons.
  - Done: wallet-based SVG master plus `16x16`, `32x32`, `180x180`, `192x192`, `512x512`, and maskable PNG variants were added.

- [x] Add iOS standalone metadata.
  - Done: Apple touch icon, app title, standalone-capable meta, status bar style, fullscreen hint, and format-detection settings were added to `index.html`.

- [x] Add an install UX inside the app.
  - Done: `Cuenta` now includes an install card with installed state, one-tap install on supported browsers, and iOS/manual fallback guidance.

- [x] Surface app/offline state in the UI.
  - Done: the app shell now shows a subtle header chip for offline, syncing queue, and sync failure states across authenticated screens.

- [x] Add a service worker update flow.
  - Done: registration now uses prompt-based updates and shows a persistent Sonner update notice with reload and dismiss actions.

- [x] Make the authenticated offline experience explicit and complete.
  - Done: groups, group settings, add expense, and settle now separate queueable offline actions from network-required ones.
  - Done: unsupported offline actions are blocked with Sonner toasts, while queued expense and settlement submits show a Sonner notice that they will sync later.
  - Done: invite refresh, member management, archive actions, and autosave all surface connection boundaries instead of failing silently.

- [x] Fix the home-screen launch path for signed-in users.
  - Done: manifest `start_url` now launches directly into `/groups`, so the installed app opens the authenticated surface first.
  - Done: fallback redirects use `replace`, so the launch path does not leave a pointless `/` entry in history.

- [x] Add safe-area-aware layout padding.
  - Done: shared safe-area utilities now offset headers, bottom nav, auth screens, and full-screen flows using `env(safe-area-inset-*)`.

## Important Polish

- [x] Add install-aware account settings.
  - Done: account now shows install state plus platform-specific guidance for iPhone/manual browser installs.

- [x] Improve startup feel.
  - Done: the auth-loading state now uses a branded launch screen instead of a bare text placeholder.

- [x] Add route-level offline empty/error states.
  - Done: groups, group detail, account, and settings now show cached-data banners and offline empty states when local data is unavailable.
  - Done: add expense and settle now explain missing offline dependencies instead of leaving the user on a dead-end loader.

- [ ] Add retry controls for failed queued mutations.
  - Current state: failed mutations are stored, but recovery is not obvious from the UI.

- [x] Cache more than the shell.
  - Done: the production precache now includes route chunks, screen components, icons, fonts, and the PWA runtime, not just the shell.
  - Done: production build now emits 39 precached entries, so repeated launches can reuse more than the entry shell.

- [x] Check chunk size and startup cost.
  - Done: route-level lazy loading split the main bundle down to about `548 kB` uncompressed, with the route screens cached separately.
  - Done: cold-start cost is materially lower because the login shell no longer pays for every authenticated screen up front.

## Nice To Have

- [x] App shortcuts in the manifest.
  - Done: added "Nuevo gasto" and "Mis grupos" as manifest shortcuts.

- [ ] Share target support.
  - Accept shared text or receipts directly into the app.

- [ ] Badge or notification support.
  - Useful for pending settlements or invite reminders, but not required for MVP app feel.

- [ ] Better install copy and post-install onboarding.
  - Teach users what improves after install: offline access, faster startup, app-like navigation.

## What To Prioritize First

1. Retry controls for failed queued mutations.
2. Fix the home-screen launch path for signed-in users.
3. Share target / app shortcuts / other nice-to-haves.

## Evidence From This Review

- Dev server login flow shows `Entrar como LLM Agent` and redirects to `/groups`.
- Production build generates `manifest.webmanifest`, `sw.js`, and `registerSW.js`.
- Production preview loads the cached login route offline once the service worker is active.
- The manifest now includes PNG install icons plus maskable variants.
- Source `index.html` now includes Apple touch icon and iOS standalone metadata.
- `Cuenta` now includes install state plus manual/browser fallback guidance.
- New builds now surface a persistent Sonner reload prompt instead of relying on silent auto-update.
- Authenticated screens now show a subtle top-right sync chip for offline and queue-related states.
- Offline boundary actions now use Sonner: blocked invite/member/archive flows warn immediately, and queued expense or settlement submits announce they will sync later.
- Route-level offline states now distinguish cached data from empty offline screens across the main authenticated flows.
- Shared screen and header layouts now apply safe-area insets for top and bottom chrome.
- The app-loading state now uses a branded launch screen.
- There is no manifest link in source `index.html`; it is injected only in production build output.
