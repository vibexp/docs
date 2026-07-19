---
title: Configuration Reference
description: How VibeXP is configured — the required config.yaml, its env-var interpolation, the baked Docker default, and the production-critical values you must set.
---

VibeXP is configured by a **single required `config.yaml`**. This page explains
that model and summarizes the **production-critical** values — it does not
duplicate every field (see
[Backend Configuration](/developer-guide/backend/configuration/) for the full
list).

## The `config.yaml` model

At startup the backend loads one YAML file, resolved in this order:

1. the `--config <path>` flag,
2. the `VIBEXP_CONFIG_FILE` environment variable,
3. `./config.yaml` in the working directory.

The file is **required**: a missing file fails fast with a message naming the
expected path. String values support environment interpolation:

| Syntax | Meaning |
|---|---|
| `${VAR}` | The value of env var `VAR` (empty, with a warning, if unset). |
| `${VAR:-default}` | `VAR` when set and non-empty, otherwise `default`. |
| `$${literal}` | A literal `${literal}` (the `$$` escapes interpolation). |

Three files in the repo anchor the surface:

- [`backend/config.example.yaml`](https://github.com/vibexp/vibexp/blob/main/backend/config.example.yaml)
  — the complete, commented field list, tuned for local development. Copy it to
  author your own `config.yaml`.
- [`backend/config.schema.json`](https://github.com/vibexp/vibexp/blob/main/backend/config.schema.json)
  — a JSON Schema for editor validation of the YAML.
- [`backend/config.docker.yaml`](https://github.com/vibexp/vibexp/blob/main/backend/config.docker.yaml)
  — the production-neutral default **baked into the published image** at
  `/app/config.yaml` (with `VIBEXP_CONFIG_FILE` pointed at it). Every operator
  knob in it is a `${VAR:-default}` reference, so a container is configured with
  environment variables alone. To take full control, mount your own file over
  `/app/config.yaml`.

:::caution[Env vars only work when the file references them]
There is no generic environment override: an env var takes effect **only if the
loaded `config.yaml` references it as `${VAR}`**. The baked Docker config wires
the common knobs listed below; anything it does not reference (multi-provider
`auth.providers` lists, `auth.oauth_as.*` token TTLs, and most tuning fields)
requires mounting your own `config.yaml`.
:::

## Must-set production values

These are the values (shown as the env vars wired in the baked image config)
you **must** review before exposing VibeXP to the internet. Defaults are for
local evaluation only.

| Env var | `config.yaml` key | Why it matters |
|---|---|---|
| `ENCRYPTION_KEY` | `security.encryption_key` | Required. **Exactly 32 bytes** (AES-256). Generate: `openssl rand -base64 24 \| cut -c1-32`. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `database.*` | PostgreSQL connection. Change `DB_PASSWORD` from the default; keep it in sync with Postgres `POSTGRES_PASSWORD`. |
| `DB_SSLMODE` | `database.sslmode` | `disable` (default) or `require`. Set `require` for managed Postgres that mandates TLS. |
| `SESSION_ENCRYPTION_KEY` | `auth.session_encryption_key` | 64 hex chars (32 bytes) backing the session cookie and OAuth state HMAC. Generate: `openssl rand -hex 32`. |
| `FRONTEND_BASE_URL` | `frontend.base_url` | Your real public URL, e.g. `https://<your-app-host>` — the single origin serving both SPA and API. A non-localhost value automatically disables the dev-login bypass. |
| `AUTH_PROVIDER` | `auth.provider` | One of `google`, `github`, `oidc`. Several at once needs a mounted `config.yaml` with `auth.providers: [...]`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (or `GITHUB_*`, `OIDC_*`) | `auth.<provider>.*` | Credentials for the chosen provider (plus `*_REDIRECT_URI` if it differs from `<FRONTEND_BASE_URL>/api/v1/auth/callback`, and `OIDC_ISSUER_URL` for OIDC). |
| `OAUTH_AS_ISSUER_URL` | `auth.oauth_as.issuer_url` | Public **HTTPS** URL enabling the embedded OAuth 2.1 Authorization Server (MCP tokens). |
| `MCP_RESOURCE_URI` | `mcp.resource_uri` | Public MCP URL, the required token audience (RFC 8707), e.g. `https://<your-app-host>/mcp/v1/common`. |
| `INSTANCE_ADMIN_EMAILS` | `auth.instance_admins` | Comma-separated emails granted the `/api/v1/admin` portal. Empty leaves the feature dormant. |
| `AUTH_ALLOWED_DOMAINS` / `AUTH_ALLOWED_EMAILS` | `auth.access_allowlist.*` | Optional. Restrict sign-in by email domain and/or exact address (comma-separated). A user is allowed if either matches; both empty means open. |

:::caution
Changing `DB_PASSWORD` after the first run does not retroactively change an
already-initialized database. Set it before the first `docker compose up`, or
reset the data volume (`docker compose down -v`) if you change it later.
:::

## Frontend runtime configuration

The SPA is embedded in the backend and served same-origin, so there is no
frontend deployment to configure. The backend serves runtime configuration at
**`/config.js`** (as `window.__VIBEXP_ENV__`), rendered from the `frontend.*`
config keys (`VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SUPPORT_EMAIL`,
`VITE_MCP_ENDPOINT`, GTM/GA4 analytics, …) — rebrand with an env var and a
restart, no rebuild. Never put secrets there: `/config.js` is world-readable.

The only frontend **build**-time values are deployment-neutral: the relative
`VITE_API_BASE_URL=/api/v1` and the `VITE_RELEASE_SHA` / `VITE_RELEASE_DATE`
release stamps.

→ Full list: [Frontend Configuration](/developer-guide/frontend/configuration/).

## Backend fields

The backend has many more fields than the production-critical subset above
(rate limits, retention, search ranking, email, GitHub App, telemetry, …). They
live in `config.yaml`; `config.example.yaml` documents every one.

→ Full list: [Backend Configuration](/developer-guide/backend/configuration/).

## Optional services

- **Semantic search** — embeddings run in-process; vector width is fixed at
  **1024**. Embedding providers are configured **per team in the app** (model,
  chunk sizing, concurrency, and query/document prefixes included), not via
  environment.
- **Model providers**: per-team OpenAI-compatible LLM endpoints, also managed
  in the app with encrypted API keys.
- **File attachments** — enable the GCS emulator service and the related `app`
  variables. See [Docker & Compose](/developer-guide/deployment/docker/).

Every running instance serves its own API spec at `/openapi.yaml` and
`/openapi.json`.

## Related

- [Self-Hosting](/developer-guide/deployment/self-hosting/)
- [Docker & Compose](/developer-guide/deployment/docker/)
