# Dividir v1 Implementation Plan

## Summary
- Build a mobile-first Splitwise-style PWA called `Dividir` with `React 19 + Vite + TanStack Router + Convex + Convex Auth + Dexie + vite-plugin-pwa`.
- Recreate the provided Stitch UI in React using Tailwind CSS and Lucide icons, applying the Premium Obsidian design system tokens instead of reusing the raw hosted HTML at runtime.
- Ship the Core MVP: auth, group list, synthesized group detail page, add expense, settle up, create and edit group, member management, and group settings.
- Use Spanish-first copy and formatting; default new groups to `ARS`, with currency editable per group.

## Key Changes
- Add a reference-ingestion step at the start of implementation:
  Download the six Stitch screenshots and HTML files with `curl -L` into a local reference folder such as `docs/stitch/` so implementation can match the source screens exactly.
- Define the route structure around the provided screens plus one missing screen:
  `/login`, `/groups`, `/groups/$groupId`, `/groups/$groupId/add-expense`, `/groups/$groupId/settle`, `/groups/$groupId/settings`, `/account`.
- Synthesize a new group detail screen in the same Obsidian style:
  show group total, per-member balances, recent expenses, and entry points to `Agregar Gasto`, `Liquidar`, and `Configuración del Grupo`.
- Keep `Cuenta` minimal in v1:
  profile summary, auth state, app install/offline status, and sign out.
- Implement Tailwind theme tokens from the Stitch design system:
  black and obsidian surfaces, lime primary, green positive, pink negative, `Space Grotesk` for headings, `Inter` for body, `JetBrains Mono` for money and metadata.
- Replace all Material Symbols from the Stitch exports with Lucide equivalents during implementation.
- Use Convex Auth for authenticated app users:
  support magic link and Google on the login screen because both are already present in the Stitch design.
- Model group membership without requiring registration:
  members are stored as group-scoped identities with `displayName`, optional avatar meta, and future-compatible invite fields.
- Keep the schema future-proof for invitations:
  include optional `inviteUuid` and `linkedUserId` fields on group members, but do not build invite-link UX in v1.
- Use Convex as the source of truth with reactive queries and idempotent mutations.
- Use Dexie for offline support with queued writes:
  cache group summaries and detail payloads locally and enqueue mutations when offline; replay FIFO on reconnect using a `clientMutationId` per mutation.
- Keep money handling in integer minor units:
  `amountMinor` plus `currencyCode` on expenses and settlements to avoid rounding issues.
- Use computed balances rather than a stored ledger:
  derive balances from expenses and settlements in Convex queries.
- Support two split modes in v1:
  `equal` and `percentage`, matching the provided `Agregar Gasto` screen.
- Implement settle-up using automatic simplification:
  compute minimal transfers from current balances and record a settlement payment when the user confirms one.
- Keep payment methods lightweight:
  record `paymentMethod` as an enum such as `cash | bank | crypto | other`; no external payment integration in v1.
- Organize Convex functions by domain:
  `auth`, `groups`, `members`, `expenses`, `settlements`, `account`, each with explicit `args` and `returns` validators.
- Core domain types and interfaces:
  `Group`, `GroupMember`, `Expense`, `ExpenseShare`, `Settlement`, `GroupBalance`, `SuggestedTransfer`, `OfflineMutation`.
- Recommended Convex table shape:
  `users`, `groups`, `groupMembers`, `expenses`, `expenseShares`, `settlements`, `offlineReceipts` or equivalent idempotency tracking.
- UI behavior defaults:
  protected routes redirect to `/login`; groups list is the post-login landing screen; the floating action button opens `Agregar Gasto`; create-group CTA opens a compact modal or sheet.

## Test Plan
- Auth:
  magic-link login, Google login, protected-route redirect, logout.
- Groups:
  create group, edit group name and currency, add and remove placeholder members, open synthesized group detail.
- Expenses:
  create equal split expense, create percentage split expense, validate payer and member selection, confirm derived balances update correctly.
- Settlement:
  verify simplified transfers from multiple expenses, record one settlement, confirm balances recompute and suggested transfers shrink.
- Offline:
  load cached groups and detail offline, create and edit while offline, reconnect and replay queue, surface failed queue items without silent data loss.
- Currency and formatting:
  amounts render correctly in `es-AR`, negative and positive states map to the correct colors, minor-unit math stays exact.
- UI fidelity:
  compare implemented screens against the Stitch references for spacing, typography, color tokens, and icon replacement consistency.
- PWA:
  installable manifest, service worker registration, offline shell load, cached route boot.

## Assumptions
- v1 is mobile-first and optimized around the supplied Stitch mobile screens.
- Invite links are not part of the first shipped flow, but the schema will preserve `inviteUuid` compatibility for later.
- Group members do not need registered accounts in v1.
- Account management is intentionally minimal.
- Expense editing, receipts, recurring expenses, friend graph, notifications, and full activity history are out of scope for the first implementation.
