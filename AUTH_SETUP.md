# Authentication setup

Propane Intelligence uses **Google Identity Services** (real OAuth 2.0) plus an **email allowlist** stored in `data/auth_allowlist.json`.

The static-site approach: Google issues a signed ID token (JWT) to the browser after the user picks an account, the JWT contains the email, and we check that email against the allowlist before granting access. No server is needed.

## Quick start

### 1. Register an OAuth client in Google Cloud Console

1. Open https://console.cloud.google.com/apis/credentials
2. Pick or create a project (e.g. "Propane Intelligence").
3. **Configure OAuth consent screen** if prompted:
   - User type: **Internal** if everyone is in your Google Workspace, otherwise **External**
   - App name: `Propane Intelligence`
   - User support email: yours
   - Developer contact: yours
4. **Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Propane Intelligence — Web`
   - **Authorized JavaScript origins** (add all that apply):
     - `https://danielwedwards.github.io` (GitHub Pages)
     - `http://localhost:3459` (local dev)
   - **Authorized redirect URIs**: leave empty (we use the JS Identity flow, not a redirect flow)
5. Copy the **Client ID** (looks like `123456789012-abcdef….apps.googleusercontent.com`).

### 2. Drop the Client ID into `index.html`

Find the line near the top of the auth section:

```js
const AUTH_GOOGLE_CLIENT_ID = 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID';
```

Replace the placeholder string with your real Client ID:

```js
const AUTH_GOOGLE_CLIENT_ID = '123456789012-abcdef….apps.googleusercontent.com';
```

Commit + push. Within 30 seconds the GitHub Pages cache will update and Google sign-in will be live.

### 3. Edit the allowlist

Open `data/auth_allowlist.json`:

```json
{
  "schema": 1,
  "allowDomains": ["ergon.com"],
  "allowEmails": ["daniel.wylie.edwards@gmail.com"],
  "demoMode": {
    "enabled": true,
    "demoEmails": ["demo", "admin"]
  }
}
```

- **`allowDomains`** — anyone with `@<domain>` gets in (use sparingly).
- **`allowEmails`** — list specific Gmail/Outlook/etc. accounts.
- **`demoMode`** — set `enabled: false` in production to remove the `demo` / `admin:admin` shortcut accounts.

To revoke access, remove the email/domain from the file and commit. The change propagates as soon as GitHub Pages serves the new JSON.

## How sessions work

- After successful sign-in, a JSON object `pi_session` is written to `sessionStorage`:
  ```json
  {
    "user": {"email":"...", "name":"...", "picture":"...", "provider":"google", "sub":"..."},
    "startedAt": 1714060800000,
    "expiresAt": 1714089600000
  }
  ```
- Default session length: **8 hours** (configurable via `AUTH_SESSION_HOURS`).
- Sessions auto-renew on user interaction (click / keydown). Idle for >8h → forced sign-out on next page load.
- `sessionStorage` clears when the tab closes — closing the browser fully signs you out.

## Activity attribution

Every event written to the Activity Feed (platform changes, scenario saves, watchlist toggles, news alerts) now includes the signed-in user's email. The Activity dropdown shows `<event> · <kind> · <time> · <name>`.

## Troubleshooting

**"Sign-in failed: invalid token"**
Almost always means the Client ID's *Authorized JavaScript origins* list doesn't include the URL you're loading the app from. Add it and wait 5 min for Google to propagate.

**Google button doesn't render at all**
1. Confirm the GIS script tag is in `<head>`: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
2. Confirm `AUTH_GOOGLE_CLIENT_ID` is not the placeholder.
3. Open browser console: errors mentioning `gsi/client` or `[GSI_LOGGER]` point at config issues.

**"… is not on the access list"**
Working as intended — the email isn't in `allowDomains` or `allowEmails`. Edit `data/auth_allowlist.json`.

**Demo mode is too permissive**
Set `demoMode.enabled: false` in `data/auth_allowlist.json`. The `demo` and `admin:admin` shortcuts will then be rejected.

## Future hardening (optional)

If you eventually need stronger guarantees:
1. **Server-side JWT verification** — host a tiny Cloudflare Worker that validates the Google ID token signature against Google's JWKS endpoint, then issues an HttpOnly cookie. Removes the "trust the JWT" client-side dependency.
2. **Microsoft sign-in** — add MSAL.js + an Azure AD app registration. Mirror the `_authHandleGoogle` shape with `_authHandleMicrosoft`.
3. **Audit log to a backend** — POST every Activity Feed entry to a logging endpoint (Cloudflare D1, Supabase, etc.). The `entry.user` field is already populated.
