---
title: Authentication & MCP Auth
description: Configure provider-agnostic login (Google, GitHub, or any OIDC provider) and the embedded OAuth 2.1 Authorization Server that secures the MCP endpoint for a self-hosted VibeXP.
sidebar:
  order: 2
---

VibeXP is **provider-agnostic** and brings its **own OAuth 2.1 Authorization Server** in-house, so you can self-host MCP authentication with **any** supported login provider — without a third-party auth service and without the MCP surface changing per provider.

:::note[No WorkOS, no external Authorization Server]
Earlier versions delegated the OAuth Authorization Server role to WorkOS. That coupling is gone. VibeXP now mints its own tokens and federates *only the login step* to your chosen provider. WorkOS/Clerk/Auth0/Keycloak still work — as a **generic OIDC** configuration, with no special-case code.
:::

## The two roles, and who plays them

The MCP authorization spec separates two roles. VibeXP plays **both**, so an MCP client only ever talks to your VibeXP instance:

| Role | Who | What it does |
| --- | --- | --- |
| **Resource Server** | VibeXP (`/mcp/v1/*`) | Validates the bearer token (audience-bound JWT), serves RFC 9728 Protected Resource Metadata |
| **Authorization Server** | VibeXP (`/oauth2/*`) | Dynamic Client Registration, PKCE, consent, token issuance, JWKS — RFC 8414 metadata |
| **Identity Provider** | Your choice (Google / GitHub / OIDC) | Authenticates the human at login time only — invisible to MCP |

VibeXP mints short-lived JWTs (audience = your `MCP_RESOURCE_URI`), signs them with DB-stored keys it rotates, and publishes its own JWKS. Compliance is therefore **constant across providers**.

:::note[`config.yaml` is the canonical config surface]
All auth settings live in the backend's `config.yaml`. In the published image, an env var only works when the baked `/app/config.yaml` references it as `${VAR}` — that covers `AUTH_PROVIDER`, the per-provider client id / secret / redirect vars, `SESSION_ENCRYPTION_KEY`, `OAUTH_AS_ISSUER_URL`, and `MCP_RESOURCE_URI`. Settings marked "mounted `config.yaml`" below are **not** env-wired: mount your own file over `/app/config.yaml` to set them.
:::

## Choose your login provider(s)

Set `AUTH_PROVIDER` to a single provider. Each enabled provider needs its own credentials. A misconfigured provider is logged and skipped (never fatal), so you can roll out one at a time.

```bash
# One of: google, github, oidc
AUTH_PROVIDER=google
```

To enable **several providers at once**, set the provider list in a mounted `config.yaml` (it takes precedence over `AUTH_PROVIDER` and is not settable via env vars):

```yaml
auth:
  providers: ["google", "github"]
```

### Google

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<your-app-host>/api/v1/auth/callback
```

### GitHub

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=https://<your-app-host>/api/v1/auth/callback
```

### Generic OIDC (Keycloak, Zitadel, Auth0, Okta, WorkOS, …)

Any standards-compliant OpenID Connect provider works through the generic adapter:

```bash
OIDC_ISSUER_URL=https://id.example.com/        # used for OIDC discovery
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
OIDC_REDIRECT_URI=https://<your-app-host>/api/v1/auth/callback
```

Register `<your-app-host>/api/v1/auth/callback` as an allowed redirect URI in the provider's console.

## Session & signing keys

```bash
ENCRYPTION_KEY=<32 raw bytes>            # AES-256 at-rest key: app data + OAuth-AS signing-key encryption
SESSION_ENCRYPTION_KEY=<64 hex chars>   # encrypts the web app session cookie (vx_session)
```

The web app keeps a server-side cookie session; the embedded Authorization Server is for MCP / programmatic OAuth clients. Both share the same provider config and user provisioning. The AS's JWT signing keys are generated, stored encrypted in the database, rotated, and served via JWKS — there are **no key files** to manage, and it is multi-instance safe.

## Enable the embedded Authorization Server (MCP auth)

The AS is **opt-in**: it stays off (routes unmounted) until you set its public issuer URL.

```bash
# Public base URL of THIS VibeXP instance (enables the AS when set)
OAUTH_AS_ISSUER_URL=https://<your-app-host>

# Token audience (RFC 8707) — your MCP endpoint. Required to enable the MCP endpoint.
MCP_RESOURCE_URI=https://<your-app-host>/mcp/v1/common
```

The token lifetimes are tunable under `auth.oauth_as.*` in a mounted `config.yaml` — they are not env-wired in the published image (sane defaults shown):

```yaml
auth:
  oauth_as:
    access_token_ttl: "15m"
    refresh_token_ttl: "720h"
    auth_code_ttl: "10m"
    key_rotation_interval: "720h"
    cleanup_interval: "1h"
```

When `OAUTH_AS_ISSUER_URL` is set, `MCP_OAUTH_ISSUER` defaults to it; setting a *divergent* `MCP_OAUTH_ISSUER` fails fast at startup (a token's issuer and the resource server's expected issuer must agree).

MCP clients (Claude Code, Cursor, …) need no API key: they perform Dynamic Client Registration, PKCE, and consent against `/oauth2/*` automatically. See [MCP Server Integration](/user-guide/mcp-server/) for the client side.

:::caution[HTTPS is required]
The Authorization Server endpoints (`/oauth2/*`, `/.well-known/oauth-authorization-server`) **reject plain-HTTP requests**. VibeXP is deploy-anywhere and does not assume a platform, so it expects **TLS to terminate at your reverse proxy / load balancer**, which must forward the original scheme as `X-Forwarded-Proto: https`. A direct TLS listener also satisfies this. Only a `localhost` `FRONTEND_BASE_URL` (local development) is exempt.
:::

`FRONTEND_BASE_URL` must point at your app's public origin — it drives the consent redirect and post-login landing:

```bash
FRONTEND_BASE_URL=https://<your-app-host>
```

## Local evaluation (no provider)

For local-only evaluation you can skip external providers entirely:

```bash
# Leave AUTH_PROVIDER unset — no external provider needed.
FRONTEND_BASE_URL=http://localhost:8080   # localhost ⇒ development mode
```

The dev-login bypass (`/api/v1/auth/dev/login`) is on by default (`auth.dev_login_enabled: true` in the shipped config) but is **honored only in local development** — a non-localhost `FRONTEND_BASE_URL` makes it inert.

In local development the embedded AS auto-derives sane defaults (issuer = the local base URL, resource URI = `<issuer>/mcp/v1/common`) and HTTPS enforcement is skipped, so a fresh checkout connects an MCP client with zero auth edits. Production never derives these and never bypasses HTTPS.

## Restricting who can sign in (optional)

Restrict sign-in by email domain and/or exact address. Both are env-wired in the published image:

```bash
AUTH_ALLOWED_DOMAINS=example.com
AUTH_ALLOWED_EMAILS=alice@example.com
```

A user is allowed if **either** list matches (comma-separate multiple values). Both empty means anyone the provider authenticates can sign in. While the allowlist is active, sign-in also requires a **provider-verified** email, so unverified accounts are denied.

To set it in a mounted `config.yaml` instead:

```yaml
auth:
  access_allowlist:
    domains: ["example.com"]
    emails: ["alice@example.com"]
```

## Designating instance admins (optional)

Instance admins get the admin portal (`/api/v1/admin`). List them via `INSTANCE_ADMIN_EMAILS` (comma-separated), or `auth.instance_admins` in a mounted `config.yaml`:

```bash
INSTANCE_ADMIN_EMAILS=admin@example.com
```

Empty (the default) leaves the feature dormant.

## What a self-hoster does NOT need

- No WorkOS (or any external Authorization Server) account.
- No JWT key files — keys live in the database and rotate automatically.
- No CORS or reverse-proxy routing config for MCP — the AS and the SPA are same-origin in the single combined image.
