---
title: Authentication
description: The identity-provider registry, sessions, dev login, API keys, the embedded OAuth 2.1 Authorization Server, and bearer-JWT verification.
---

The backend supports several authentication mechanisms so the web app, CLI,
native clients, and AI agents can all authenticate appropriately. The auth code
lives in `internal/auth`, split into focused subpackages:

| Package | Role |
| --- | --- |
| `internal/auth/idp` | Identity-provider registry and the Google / GitHub / generic-OIDC web-login providers. |
| `internal/auth/session` | The encrypted `vx_session` cookie. |
| `internal/auth/oauthserver` | The embedded OAuth 2.1 Authorization Server (built on [ory/fosite](https://github.com/ory/fosite)). |
| `internal/auth/authkit` | The shared JWT verifier behind both bearer-token surfaces. |
| `internal/auth/mcptoken` | Adapts `authkit` to the MCP SDK's token-verifier contract. |

For the keys referenced here, see
[Configuration → Authentication](/developer-guide/backend/configuration/#authentication).

## Identity providers (the config-driven registry)

Web login is driven by a **provider registry** built at startup from
`auth.providers` — a list of provider names to enable **simultaneously**:

- **`google`** — Google OIDC, reached directly via `accounts.google.com`
  discovery. Configure `auth.google.client_id`, `auth.google.client_secret`
  (via `${GOOGLE_CLIENT_SECRET}`), and `auth.google.redirect_uri`.
- **`github`** — GitHub OAuth2 (not OIDC; claims come from the GitHub REST
  API). Configure the `auth.github.*` block.
- **`oidc`** — any generic, OIDC-compliant issuer (Keycloak, Authentik,
  Zitadel, Auth0, …). Configure the `auth.oidc.*` block;
  `auth.oidc.issuer_url` drives `/.well-known/openid-configuration` discovery.

Names are matched **case-insensitively**. An empty list disables web login
entirely (dev login still works). The single-value `auth.provider` key remains
as a backward-compatible shim, used only when `auth.providers` is empty.

The enabled set is exposed at **`GET /api/v1/auth/providers`**, which returns
each provider's canonical name plus a display label (`Google`, `GitHub`,
`Single Sign-On`) — the frontend login screen renders its provider picker from
this response rather than hardcoding a list.

:::caution[Misconfiguration is non-fatal]
An unknown name in `auth.providers`, a provider with missing credentials, or
failed OIDC discovery against a bad issuer logs a **warning** and skips that
provider — the backend still boots with whatever subset initialized. Web login
for the skipped provider is simply absent from the picker. The exception: a
non-empty but invalid GitHub App private key fails fast at startup.
:::

## Sessions

After the OAuth flow, the web app authenticates with an httpOnly session cookie
named **`vx_session`**. Its payload is encrypted with AES-256-GCM using
`auth.session_encryption_key` — a hex-encoded secret that must decode to
exactly 32 bytes (**64 hex characters**). The same secret also backs (via
domain separation) the HMAC that signs the short-lived `vx_state` OAuth state
cookie. When the key is empty, cookie session auth is disabled (stub/test
mode). Generate a production value with:

```bash
openssl rand -hex 32
```

## Dev login bypass

For local development, set `auth.dev_login_enabled: true` to enable
`POST /api/v1/auth/dev/login`, which mints a session without an external IdP.
The endpoint responds only when the flag is `true` **and** the environment is
detected as local development — `frontend.base_url` pointing at `localhost` or
`127.0.0.1`. The detection is fail-closed (an empty value counts as
production), so the flag has no effect in real deployments even if left on.

## Sign-in allow-list

`auth.signin_allowed_emails` is a list of addresses permitted to sign in. When
empty (the default), registration is open — anyone can sign in. Set a list to
restrict access:

```yaml
auth:
  signin_allowed_emails:
    - alice@example.com
    - bob@example.com
```

## API keys

Long-lived API keys authenticate non-browser clients (the CLI, Claude Code
hooks) and are sent as a bearer token. They are managed through the API-keys
endpoints and persisted in the database. A separate admin key,
`security.backoffice_admin_api_key`, gates the back-office endpoints (`/bo/*`)
and is unrelated to JWTs and regular API keys.

## The embedded OAuth 2.1 Authorization Server

VibeXP ships its own **OAuth 2.1 Authorization Server**, embedded in the
backend process (`internal/auth/oauthserver`, built on
[ory/fosite](https://github.com/ory/fosite)). It is what mints the bearer JWTs
the [MCP endpoint](/developer-guide/backend/mcp-server/) accepts — no external
identity platform is involved in token issuance. All AS state (registered
clients, authorization codes, tokens, PKCE, signing keys, login sessions) is
persisted in Postgres, so it works across replicas.

The AS is mounted when `auth.oauth_as.issuer_url` is set; empty disables it
(except in local development — see zero-config mode below). The issuer URL is
the AS's public base URL and becomes the token `iss` claim and the metadata
`issuer`.

### Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /oauth2/authorize` | Authorization endpoint (authorization-code + PKCE). |
| `POST /oauth2/token` | Token endpoint (`authorization_code` and `refresh_token` grants). |
| `POST /oauth2/register` | Dynamic Client Registration (RFC 7591). |
| `GET /oauth2/jwks.json` | The JWKS with the active + previous RS256 signing keys. |
| `GET /.well-known/oauth-authorization-server` | AS metadata (RFC 8414), advertising all of the above. |

These are protocol routes: they are public by design (clients reach them before
they hold a token), protected by the protocol itself (PKCE, client/redirect
validation, a consent CSRF token) and rate-limited per IP like the auth routes
(`rate_limit.auth_per_minute`). They are mounted only when the AS is enabled,
and are intentionally absent from `openapi.yaml`.

### Dynamic Client Registration

MCP clients self-register via `POST /oauth2/register`. Only **public clients**
are supported (`token_endpoint_auth_method: none` — PKCE stands in for a client
secret), with `authorization_code` / `refresh_token` grants. Redirect URIs must
be absolute and fragment-free: `https` URLs, loopback `http` addresses
(`127.0.0.1`, `::1`, `localhost` — for native apps), or custom private-use URI
schemes.

### Token lifetimes

| Setting | Default |
| --- | --- |
| `auth.oauth_as.access_token_ttl` | `15m` |
| `auth.oauth_as.refresh_token_ttl` | `720h` (30 days) |
| `auth.oauth_as.auth_code_ttl` | `10m` |

All must be positive, and the refresh TTL must exceed the access TTL —
validated at startup so the server fails closed rather than minting unbound or
never-expiring tokens. Access tokens are RS256-signed JWTs whose `sub` is the
internal VibeXP user ID and whose `aud` is `mcp.resource_uri` (RFC 8707).

### Key rotation and cleanup

- **Coordinated key rotation.** The RS256 signing key rotates every
  `auth.oauth_as.key_rotation_interval` (default `720h`). Rotation is
  coordinated through the database so multiple replicas never double-rotate:
  a replica that sees a peer rotating drops its cache and re-checks under a
  lock. Previous keys stay in the JWKS until retired, so freshly rotated
  tokens keep verifying.
- **Retention/cleanup.** Every `auth.oauth_as.cleanup_interval` (default `1h`)
  the AS prunes expired authorization codes, access and refresh tokens, PKCE
  and login sessions, and retired signing keys.

### HTTPS-only in production

Every AS endpoint is behind an HTTPS-enforcing middleware: plain-HTTP requests
are rejected with `403` unless the process is running in local development
(the same `frontend.base_url`-on-localhost heuristic as dev login, fail-closed).
A request counts as HTTPS when TLS terminates at the process (`r.TLS`) **or**
an upstream reverse proxy forwards `X-Forwarded-Proto: https` — VibeXP assumes
no specific platform, so either signal is accepted.

### Zero-config local mode

On a fresh checkout with the example config, the AS "just works" with **zero
auth configuration**:

- When the environment is local development and `auth.oauth_as.issuer_url` is
  empty, it is auto-derived as `http://localhost:<server.port>`.
- `mcp.resource_uri` is auto-derived as `<issuer>/mcp/v1/common`, and
  `mcp.oauth_issuer` defaults to the AS issuer.

Explicit configuration always wins — a value already set is never overwritten —
and pointing `mcp.oauth_issuer` at an external issuer without enabling the AS
opts out of auto-enablement. Production never auto-enables: the AS stays
strictly opt-in and the backend never guesses a public issuer.

### The SPA consent flow

The AS **never authenticates anyone itself** — it delegates login to the app:

1. `GET /oauth2/authorize` validates the client and stashes the request as a
   **user-less login session**, then redirects the browser to the SPA consent
   page: `<frontend.base_url>/oauth/consent?login=<id>`.
2. If the user is not signed in to VibeXP, the SPA sends them to
   `/login?return_to=<consent-url>` — the validated, same-origin `return_to`
   brings them back to the consent page after login. **An authenticated app
   user is required before consent.**
3. The consent page calls `GET /api/v1/oauth/consent` for the client details
   (name, redirect host, scopes) and `POST /api/v1/oauth/consent/attach` to
   bind the logged-in app user to the login session — the one AS route behind
   the standard session-auth middleware, so signing out gates MCP
   authorization.
4. The approve/deny decision goes to `POST /api/v1/oauth/consent` (CSRF-bound
   to the login session); on approval the AS issues the authorization code and
   redirects back to the client.

All issuance, CSRF, and redirect validation stays server-side; the SPA only
renders the screen.

## Bearer-JWT verification (`authkit`)

Both bearer-token surfaces verify tokens with the shared
`internal/auth/authkit` verifier: JWKS-backed signature verification with the
keys fetched from `<issuer>/oauth2/jwks.json` (the `jwks_uri` the embedded AS
publishes in its metadata), an **RS256 algorithm pin** (defense against
algorithm-substitution), registered-claim validation with 60s clock-skew
leeway, a pluggable audience policy, and resolution of the token subject to an
internal VibeXP user.

- **MCP** (`/mcp/v1/common`): `internal/auth/mcptoken` wraps `authkit` with a
  strict RFC 8707 audience requirement — the token `aud` must include
  `mcp.resource_uri`. The token `sub` is the internal user ID (the embedded AS
  mints it that way), resolved directly.
- **API surface** (`/api/v1/*`): when `auth.api_oauth.issuer` is set, bearer
  JWTs are accepted alongside session cookies and API keys.
  `auth.api_oauth.audiences` optionally pins the accepted audiences; by
  default any audience is accepted **except** the MCP resource URI, so
  MCP-bound tokens stay MCP-only.

:::note
The `authkit` package name is historical — it predates the embedded
Authorization Server. Today the tokens it verifies are minted by VibeXP's own
embedded AS.
:::

## Request resolution

The authentication middleware resolves the caller from — in effect — a session
cookie, a bearer JWT, or an API key, and binds the resolved subject to the
request context (see `internal/contextkeys`). Downstream handlers and services
read the authenticated identity from the context rather than re-parsing headers.
