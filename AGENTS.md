# Agent Notes

## App Test Flow

Use `agent-browser` to verify the app end to end:

1. Start the app with `npm run dev`.
2. Open the local URL shown by Vite, usually `http://localhost:5175/`.
3. On the login screen, click the one-click button labeled `Entrar como LLM Agent`.
4. Confirm the app redirects to `/groups`.
5. Confirm the dashboard loads and shows demo groups, such as `Viaje a Ibiza 2024`.

## Dev Login

- The one-click login only appears when `VITE_DEV_LOGIN_ENABLED=true` is set in `.env.local`.
- Use the one-click login for local testing instead of the full email or Google auth flow.
- If Convex backend changes were made, sync them before testing so the browser sees the latest auth code.

## Browser Automation

- Prefer `agent-browser` for interactive app checks.
- After clicking a navigation-changing control, take a fresh snapshot before continuing.
- Use the visible button text `Entrar como LLM Agent` when verifying the dev login path.
