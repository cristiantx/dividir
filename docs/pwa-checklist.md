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

- [ ] Add real app icons.
  - Current state: manifest only exposes `/favicon.svg` as the single icon.
  - Needed: `192x192`, `512x512`, and maskable icons for Android install surfaces.

- [ ] Add iOS standalone metadata.
  - Current state: `theme-color` exists, but no `apple-mobile-web-app-capable`, app title, or touch icon metadata is present.
  - Needed: Apple touch icon, status bar style, standalone-capable meta, and iOS-specific launch polish.

- [ ] Add an install UX inside the app.
  - Current state: no install prompt handling or "Install app" CTA exists in `src`.
  - Needed: capture `beforeinstallprompt`, expose install entry point, and show installed state.

- [ ] Surface app/offline state in the UI.
  - Current state: offline logic exists, but the shell does not visibly show connection state, sync state, or cached mode at the top level.
  - Needed: global offline banner, syncing indicator, queued changes count, failed-sync warning, and "last synced" copy.

- [ ] Add a service worker update flow.
  - Current state: `registerType: "autoUpdate"` is configured, but there is no user-facing "new version available" or reload affordance.
  - Needed: detect waiting SW, show refresh CTA, and avoid silent stale sessions.

- [ ] Make the authenticated offline experience explicit and complete.
  - Current state: groups, group detail, current user, and queued writes are cached, but offline support is partial and uneven.
  - Needed: define which screens work offline, mark unsupported actions clearly, and avoid dead-end forms.

- [ ] Fix the home-screen launch path for signed-in users.
  - Current state: manifest `start_url` is `/`, which redirects to `/groups` only after app bootstrap.
  - Needed: confirm cold launch is fast and deterministic for both signed-in and signed-out users, including offline launch.

- [ ] Add safe-area-aware layout padding.
  - Current state: `viewport-fit=cover` is set, but CSS does not use `env(safe-area-inset-*)`.
  - Needed: notch/home-indicator padding for headers, bottom nav, and full-screen forms.

## Important Polish

- [ ] Add install-aware account settings.
  - Show whether the app is installed, how to install it, and platform-specific guidance for iPhone vs Android.

- [ ] Improve startup feel.
  - Add a branded launch/loading state for cold opens so the app does not feel like a blank web reload.

- [ ] Add route-level offline empty/error states.
  - Explain when data is cached, stale, unavailable, or pending sync instead of only failing actions.

- [ ] Add retry controls for failed queued mutations.
  - Current state: failed mutations are stored, but recovery is not obvious from the UI.

- [ ] Cache more than the shell.
  - Audit fonts, icons, and route assets so repeated launches feel instant and resilient.

- [ ] Check chunk size and startup cost.
  - Current state: the main JS bundle is about `761 kB` before gzip warnings in production build.
  - Needed: reduce cold-start latency, especially on lower-end phones.

## Nice To Have

- [ ] App shortcuts in the manifest.
  - Example: "Nuevo gasto", "Mis grupos", "Cuenta".

- [ ] Share target support.
  - Accept shared text or receipts directly into the app.

- [ ] Badge or notification support.
  - Useful for pending settlements or invite reminders, but not required for MVP app feel.

- [ ] Better install copy and post-install onboarding.
  - Teach users what improves after install: offline access, faster startup, app-like navigation.

## What To Prioritize First

1. Real icons plus iOS metadata.
2. Install prompt UX plus installed-state detection.
3. Global offline and sync status UI.
4. Update available flow for new builds.
5. Safe-area padding and launch-state polish.

## Evidence From This Review

- Dev server login flow shows `Entrar como LLM Agent` and redirects to `/groups`.
- Production build generates `manifest.webmanifest`, `sw.js`, and `registerSW.js`.
- Production preview loads the cached login route offline once the service worker is active.
- There is no manifest link in source `index.html`; it is injected only in production build output.
- No install-specific UI was found in `src`.
