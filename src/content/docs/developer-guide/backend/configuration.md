---
title: Backend Configuration
description: The complete environment-variable reference for the VibeXP backend.
---

The backend is configured entirely through environment variables, loaded at
startup with [kelseyhightower/envconfig](https://github.com/kelseyhightower/envconfig)
(see `internal/config`). This page is the canonical reference for every variable.
The authoritative source is `backend/.env.example` in the
[repo](https://github.com/vibexp/vibexp) — copy it to `backend/.env` for local
development (`make backend-run-dev` does this automatically if `.env` is missing).

## How configuration is loaded

- Values come from the process environment. There is no config file format; in
  local dev the Makefile exports the contents of `backend/.env`.
- Variables are read once at boot. Most are optional and have safe defaults;
  optional integrations stub out cleanly when left empty.
- A handful are **hard requirements** — the service fails to start without them.

:::danger[Hard requirements]
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — a reachable Postgres.
- `ENCRYPTION_KEY` — must be **exactly 32 bytes** (AES-256). The service refuses
  to start otherwise. Generate one with `openssl rand -hex 16` (32 hex chars = 32 bytes).
:::

## Server

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `PORT` | `8080` | No | HTTP listen port. |
| `LOG_LEVEL` | `info` | No | `debug` \| `info` \| `warn` \| `error`. Use `debug` locally. |
| `LOG_FORMAT` | `json` | No | `json` (structured, for aggregators) or `text` (human-readable). |
| `SERVICE_VERSION` | `dev` | No | Version tag attached to metrics/traces. |

## Database

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `DB_HOST` | `localhost` | **Yes** | Postgres host. Use `postgres` with Docker Compose. |
| `DB_PORT` | `5432` | **Yes** | Postgres port. |
| `DB_USER` | `vibexp_app` | **Yes** | Database user. |
| `DB_PASSWORD` | `local_password` | **Yes** | Database password. Change for any real deployment. |
| `DB_NAME` | `vibexp_io` | **Yes** | Database name. |

See [Database & Migrations](/developer-guide/backend/database/) for pooling and
migration behaviour.

## Security & encryption

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `ENCRYPTION_KEY` | — | **Yes** | AES-256 key for encrypting sensitive data at rest. Must be exactly 32 bytes. |
| `API_KEY_COMMON` | — | No | Shared API key for the common API surface. |
| `BACKOFFICE_ADMIN_API_KEY` | — | No | Admin key for back-office endpoints (`/bo/*`). Separate from JWTs and regular API keys. |

## Authentication

Selects and configures the web-login identity provider. See
[Authentication](/developer-guide/backend/authentication/) for the full model.

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `AUTH_PROVIDER` | _(empty)_ | No | `workos`, `oidc`, or empty (auto-detect: WorkOS if its credentials are set, else a no-op stub). |
| `SIGNIN_ALLOWED_EMAILS` | _(empty)_ | No | Comma-separated allowlist. Empty means open registration. |
| `DEV_LOGIN_ENABLED` | `false` | No | Enables `/api/v1/auth/dev/login` (bypasses the IdP). Local development only. |

:::caution
Misconfiguration is never fatal: if the selected provider can't initialize (e.g.
OIDC discovery fails against a bad issuer), the backend logs a warning, falls
back to the no-op stub, and still boots. Web login is disabled, but dev login
keeps working.
:::

### WorkOS AuthKit (`AUTH_PROVIDER=workos` or auto-detected)

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `WORKOS_API_KEY` | _(empty)_ | When using WorkOS | WorkOS API key. |
| `WORKOS_CLIENT_ID` | _(empty)_ | When using WorkOS | WorkOS Client ID. |
| `WORKOS_COOKIE_PASSWORD` | dev value | When using WorkOS | 32-byte hex string deriving the AES-GCM key that encrypts the `vx_session` cookie. Generate with `openssl rand -hex 32`. |
| `WORKOS_REDIRECT_URI` | `http://localhost:8080/api/v1/auth/callback` | When using WorkOS | OAuth callback registered in WorkOS. |

### Generic OIDC (`AUTH_PROVIDER=oidc`)

Works with any OIDC-compliant issuer (Keycloak, Authentik, Zitadel, Auth0, Google).

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `OIDC_ISSUER_URL` | _(empty)_ | When using OIDC | Issuer for discovery (`/.well-known/openid-configuration` appended). |
| `OIDC_CLIENT_ID` | _(empty)_ | When using OIDC | OAuth client ID. |
| `OIDC_CLIENT_SECRET` | _(empty)_ | When using OIDC | OAuth client secret. |
| `OIDC_REDIRECT_URI` | `http://localhost:8080/api/v1/auth/callback` | When using OIDC | Callback URI registered with the provider. |

## MCP OAuth (resource server)

The `/mcp/v1/common` endpoint is an OAuth 2.1 resource server delegating to
AuthKit. See [MCP Server](/developer-guide/backend/mcp-server/).

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `MCP_OAUTH_ISSUER` | _(empty)_ | To enable MCP | AuthKit issuer URL. JWKS fetched from `<issuer>/oauth2/jwks`. Empty disables the endpoint (rejects all tokens with 401). |
| `MCP_RESOURCE_URI` | _(empty)_ | To enable MCP | Canonical MCP resource identifier and required token audience (RFC 8707). No default. |

## API-surface OAuth

When set, `/api/v1/*` accepts AuthKit bearer JWTs (mobile / native PKCE clients)
alongside session cookies and API keys.

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `API_OAUTH_ISSUER` | _(empty)_ | No | AuthKit issuer URL. Empty rejects non-API-key bearer tokens with 401. |
| `API_OAUTH_AUDIENCES` | _(empty)_ | No | Optional comma-separated `aud` allow-list. Default accepts any audience except the MCP resource URI. |

:::caution
With the default `API_OAUTH_AUDIENCES`, any AuthKit access token from the issuer
for a provisioned user is an API credential — including the access token inside
web sessions. Never log or forward such tokens.
:::

## Frontend & CORS

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | No | Public URL of the web app (redirects, email links). |
| `CORS_ALLOWED_ORIGINS` | _(empty)_ | No | Comma-separated allowed origins. Empty allows only localhost dev origins. |

## Attachments (GCS)

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `GCS_RESOURCE_ATTACHMENTS_BUCKET` | _(empty)_ | No | GCS bucket for attachments. Empty disables attachments (upload/download/delete return 503). |

## Embeddings

Embeddings are generated in-process by an async event-bus worker: text is chunked
in Go, embedded via the active provider, and stored in pgvector. There is **no**
external AI service and **no** message broker.

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | No | The `model_id` tag written on every row and used as the search filter. Set to the model your provider serves. |
| `EMBEDDING_CHUNK_SIZE` | `1000` | No | Rune-based chunk size for the in-Go chunker. |
| `EMBEDDING_CHUNK_OVERLAP` | `200` | No | Overlap between chunks (must be smaller than the chunk size). |

:::note
The embedding **provider** (an OpenAI-compatible `/v1/embeddings` endpoint:
OpenAI, Ollama, LocalAI, vLLM, TEI, …) is configured **in-app** in the
`embedding_providers` table (`base_url`, `api_key`, `provider_type`), not via env.
If no provider is configured, entities are still saved and embedding is skipped.

The embedding vector width is **fixed at 1024 in code** — it is locked to the
pgvector column and is **not** configurable. There is no `EMBEDDING_DIMENSIONS`
variable. Pick a model that outputs (or can be asked for) 1024 dimensions.
:::

## Email

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `EMAIL_PROVIDER` | `smtp` | No | `smtp`, `mailgun`, `postmark`, or `sendgrid`. |
| `EMAIL_FROM_ADDRESS` | `dev@vibexp.local` | Required for non-smtp providers | Sender address. Falls back to `SMTP_USERNAME` for smtp. |
| `CONTACT_RECIPIENT_ADDRESS` | _(empty)_ | No | Inbox for contact/support emails. Falls back to `EMAIL_FROM_ADDRESS`, then `SMTP_USERNAME`. |

**SMTP** (`EMAIL_PROVIDER=smtp`). Dev defaults point at Mailpit (UI at
`http://localhost:8025`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `SMTP_HOST` | `localhost` | SMTP host. |
| `SMTP_PORT` | `1025` | SMTP port. |
| `SMTP_USERNAME` | `dev` | SMTP username. |
| `SMTP_PASSWORD` | `dev` | SMTP password. |

**Mailgun** (`EMAIL_PROVIDER=mailgun`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `MAILGUN_DOMAIN` | `mg.example.com` | Mailgun sending domain. |
| `MAILGUN_SENDING_KEY` | — | Mailgun private API key. |
| `MAILGUN_BASE_URL` | _(empty)_ | Region base URL; empty uses the US default. |

**Postmark** (`EMAIL_PROVIDER=postmark`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTMARK_SERVER_TOKEN` | — | Postmark Server API token. |
| `POSTMARK_MESSAGE_STREAM` | `outbound` | Message stream to send on. |

**SendGrid** (`EMAIL_PROVIDER=sendgrid`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `SENDGRID_API_KEY` | — | SendGrid API key with the "Mail Send" permission. |

## GitHub App

Optional. Leave empty for local dev (the provider stubs out).

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `GITHUB_APP_ID` | _(empty)_ | No | App ID from your GitHub App settings. |
| `GITHUB_APP_PRIVATE_KEY` | _(empty)_ | No | Base64-encoded private key. A non-empty but invalid value fails startup on PEM parsing. |
| `GITHUB_CLIENT_ID` | _(empty)_ | No | OAuth Client ID for user authorization. |
| `GITHUB_CLIENT_SECRET` | _(empty)_ | No | OAuth Client Secret. |
| `GITHUB_WEBHOOK_URL` | `https://api.example.com/webhooks/github` | No | Public URL GitHub sends events to. |
| `GITHUB_WEBHOOK_SECRET` | _(empty)_ | No | Secret used to verify webhook payloads. |

## HubSpot

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `HUBSPOT_CRM_ACCESS_KEY` | _(empty)_ | No | HubSpot Private App access token for contact sync. Empty disables the integration. |

## Event bus

Async event processing (embeddings, analytics, HubSpot sync). All optional with
production-tuned defaults; values are validated and capped.

| Variable | Default | Max | Purpose |
| --- | --- | --- | --- |
| `EVENT_BUS_WORKER_COUNT` | `20` | `1000` | Concurrent event workers. |
| `EVENT_BUS_BUFFER_SIZE` | `500` | `10000` | Event queue buffer size. |
| `EVENT_BUS_MAX_RETRIES` | `3` | `10` | Max retry attempts per event. |
| `EVENT_BUS_RETRY_BACKOFF` | `200ms` | `5s` | Base retry delay; exponential, capped at 30s per attempt. |
| `EVENT_BUS_RETRY_JITTER` | `true` | — | Randomize backoff (±10%) to avoid thundering herd. |

## OpenTelemetry

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `localhost:4317` | No | OTLP collector endpoint (gRPC `host:port`, no scheme). |
| `OTEL_METRIC_EXPORT_INTERVAL` | `60s` | No | Metric export interval. |
| `OTEL_ENVIRONMENT` | _(empty)_ | No | Deployment environment (e.g. `development`, `production`). Takes precedence over `ENVIRONMENT`/`ENV`/`DEPLOYMENT_ENVIRONMENT`. Defaults to `production` if none set. |
| `GCP_PROJECT_ID` | _(empty)_ | No | Used only for observability (trace/log correlation). |

## A2A (agent-to-agent)

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `A2A_DEFAULT_TIMEOUT` | `5m` | No | Max time to wait for agent-to-agent HTTP responses. |

## Rate limiting & body size

Abuse-hardening backstops; all have safe defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MAX_BODY_SIZE_BYTES` | `10485760` (10 MiB) | Global request-body cap. Contact form and webhooks cap at 64 KiB. |
| `AUTH_RATE_LIMIT_PER_MINUTE` | `10` | Per-IP limit on `/api/v1/auth/*`. |
| `CONTACT_RATE_LIMIT_PER_MINUTE` | `5` | Per-IP limit on the contact form. |
| `API_RATE_LIMIT_PER_MINUTE` | `100` | Per-IP limit on the authenticated API surface. |

## Error responses

| Variable | Default | Purpose |
| --- | --- | --- |
| `ERROR_TYPE_BASE_URI` | `about:blank` | RFC 9457 error `type` base URI. Set to a public URL documenting your error codes (joined as `<base>/<code>`). |

## Internal jobs (Pub/Sub OIDC)

OIDC auth for internal job endpoints (`/internal/jobs/*`), e.g. Cloud Scheduler.
Unrelated to embeddings; leave empty for local dev.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBSUB_PUSH_AUDIENCE` | _(empty)_ | Public HTTPS URL the OIDC caller targets; the token's audience must match it. |
| `PUBSUB_PUSH_SERVICE_ACCOUNT_SUFFIX` | _(empty)_ | Optional. Restrict accepted tokens to a service-account domain. |
