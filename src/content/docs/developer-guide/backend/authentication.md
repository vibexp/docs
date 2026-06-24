---
title: Authentication
description: WorkOS AuthKit, generic OIDC, dev login, sessions, API keys, and MCP token binding.
---

The backend supports several authentication mechanisms so the web app, CLI,
native clients, and AI agents can all authenticate appropriately. The auth code
lives in `internal/auth`. For the variables referenced here, see
[Configuration → Authentication](/developer-guide/backend/configuration/#authentication).

## Identity providers

`AUTH_PROVIDER` selects the web-login identity provider:

- **`workos`** — [WorkOS AuthKit](https://workos.com/) (the primary provider).
  Configure with `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`,
  and `WORKOS_REDIRECT_URI`.
- **`oidc`** — any generic, OIDC-compliant issuer (Keycloak, Authentik, Zitadel,
  Auth0, Google). Configure with `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`,
  `OIDC_CLIENT_SECRET`, and `OIDC_REDIRECT_URI`. The backend appends
  `/.well-known/openid-configuration` to the issuer for discovery.
- **_(empty)_** — auto-detect: WorkOS is used if `WORKOS_CLIENT_ID` and
  `WORKOS_API_KEY` are both present; otherwise a **no-op stub** is used (web login
  is disabled, but dev login still works). This is the default and keeps local dev
  unchanged.

:::caution[Misconfiguration is non-fatal]
If the selected provider can't initialize — for example OIDC discovery fails
against an unreachable or invalid issuer — the backend logs a **warning**, falls
back to the no-op stub, and **still boots**. Web login is disabled, but dev login
(`DEV_LOGIN_ENABLED=true`) keeps working. The exception: a non-empty but invalid
WorkOS client ID or GitHub private key fails fast at startup.
:::

## Dev login bypass

For local development, set `DEV_LOGIN_ENABLED=true` to enable
`POST /api/v1/auth/dev/login`, which mints a session without an external IdP. This
lets you develop with no WorkOS/OIDC credentials configured. It is intended for
localhost only and has no effect in real deployments.

## Sessions

After the OAuth flow, the web app authenticates with an httpOnly session cookie
named **`vx_session`**. Its payload is encrypted with an AES-GCM key derived from
`WORKOS_COOKIE_PASSWORD` (a 32-byte hex string). Generate a production value with:

```bash
openssl rand -hex 32
```

## Sign-in allowlist

`SIGNIN_ALLOWED_EMAILS` is a comma-separated allowlist of addresses permitted to
sign in. When empty (the default), registration is open — anyone can sign in. Set
a list to restrict access:

```bash
SIGNIN_ALLOWED_EMAILS=alice@example.com,bob@example.com
```

## API keys

Long-lived API keys authenticate non-browser clients (the CLI, Claude Code hooks)
and are sent as a bearer token. They are managed through the API-keys endpoints
and persisted in the database. A separate admin key,
`BACKOFFICE_ADMIN_API_KEY`, gates the back-office endpoints (`/bo/*`) and is
unrelated to JWTs and regular API keys.

## API-surface bearer JWTs

When `API_OAUTH_ISSUER` is set, `/api/v1/*` also accepts AuthKit-issued bearer
JWTs (for mobile and other native OAuth + PKCE clients) alongside session cookies
and API keys. `API_OAUTH_AUDIENCES` optionally restricts accepted audiences; by
default any audience is accepted **except** the MCP resource URI, so MCP-bound
tokens stay MCP-only.

## MCP token binding

The MCP endpoint (`/mcp/v1/common`) is a separate OAuth 2.1 resource server. It
accepts only AuthKit-issued bearer JWTs minted for `MCP_RESOURCE_URI`, using
RFC 8707 audience binding so a token issued for one resource can't be replayed
against another. See [MCP Server](/developer-guide/backend/mcp-server/) for
details.

## Request resolution

The authentication middleware resolves the caller from — in effect — a session
cookie, a bearer JWT, or an API key, and binds the resolved subject to the
request context (see `internal/contextkeys`). Downstream handlers and services
read the authenticated identity from the context rather than re-parsing headers.
