---
title: Backend Configuration
description: The config.yaml reference for the VibeXP backend — loading, interpolation, secrets, and every configuration key.
---

The backend is configured through a **required `config.yaml`** file, loaded at
startup with [koanf](https://github.com/knadh/koanf) (see `internal/config`).
This page is the canonical reference for every key. The authoritative,
fully-commented source is `backend/config.example.yaml` in the
[repo](https://github.com/vibexp/vibexp) — copy it to `backend/config.yaml` for
local development (`make backend-run` / `make backend-run-dev` do this
automatically if `config.yaml` is missing).

## How configuration is loaded

1. **Path resolution.** The config file path is taken from the `--config` flag,
   then the `VIBEXP_CONFIG_FILE` environment variable, then `./config.yaml`.
2. **Fail-fast.** The file is **required**: a missing file aborts startup with
   an error naming the expected path and pointing at `config.example.yaml`.
3. **Defaults, then file.** Code-level defaults are merged first; the YAML file
   overrides any of them, and the result is unmarshalled into a nested `Config`
   struct (the koanf tags name each section/key).
4. **Interpolation.** `${VAR}` references in the file's **string values** are
   resolved against the process environment (see the grammar below).
5. **Validation.** Invariants are checked before the server starts — the
   service fails closed on a bad config rather than running misconfigured.

The published Docker image bakes a production-neutral default config
(`config.docker.yaml`) at `/app/config.yaml` and sets `VIBEXP_CONFIG_FILE`
accordingly, so `docker run` works with environment variables alone; mount your
own file over that path to take full control.

:::danger[Hard requirements]
- A reachable Postgres (`database.*`; the password comes from `${DB_PASSWORD}`).
- `security.encryption_key` — must be **exactly 32 bytes** (AES-256). The
  service refuses to start otherwise. Generate one with `openssl rand -hex 16`
  (32 hex chars = 32 bytes).
- Rate limits must be ≥ 1, retention windows must be in `1..3650` days,
  search-ranking weights must be valid, and the OAuth-AS token lifespans must
  be positive and ordered. All are validated at startup.
:::

## Interpolation grammar

Interpolation applies to **string values only** and operates on the parsed YAML
tree, so it can never corrupt YAML syntax:

| Expression | Resolves to |
| --- | --- |
| `${VAR}` | The value of environment variable `VAR`. Unset → empty string plus a startup warning. |
| `${VAR:-default}` | `VAR` when set and non-empty, otherwise `default`. |
| `$${literal}` | A literal `${literal}` — the `$$` escapes interpolation. |

## Secrets live in `.env`, structure lives in `config.yaml`

`config.yaml` holds all **non-secret** settings as literal values. Secrets are
referenced as `${VAR}` and resolved from the environment at load time — keep
them out of the file and out of git. `backend/.env.example` lists every `${VAR}`
secret (database password, encryption key, session key, provider client
secrets, email keys); `make backend-run*` loads `.env` into the environment so
the references resolve.

## The JSON schema

`backend/config.schema.json` is a committed JSON schema generated from the
nested `Config` struct — it gives editors (VS Code / JetBrains via the YAML
language server) validation and autocomplete for `config.yaml`. Both
`config.example.yaml` and `config.docker.yaml` declare it via a
`yaml-language-server` header comment.

```bash
make backend-generate-config-schema   # regenerate via go run ./cmd/gen-config-schema
make backend-config-schema-check      # regenerate, then fail if it differs from the committed file
```

CI runs `backend-config-schema-check`, so regenerate and commit the schema
whenever you change the `Config` struct.

## Server

| Key | Default | Purpose |
| --- | --- | --- |
| `server.port` | `8080` | HTTP listen port. |
| `server.log_level` | `info` | `debug` \| `info` \| `warn` \| `error`. Use `debug` locally. |
| `server.log_format` | `json` | `json` (structured, for aggregators) or `text` (human-readable). |
| `server.service_version` | `dev` | Version tag attached to metrics/traces. Release builds inject it. |
| `server.release_sha` / `server.release_date` | `dev` / `unknown` | Build metadata. |
| `server.max_body_size_bytes` | `10485760` (10 MiB) | Global request-body cap (memory-exhaustion backstop). Webhooks and the OAuth AS JSON endpoints cap at 64 KiB. |
| `server.cors_allowed_origins` | _(empty)_ | Allowed CORS origins. Empty allows only the localhost dev origins (`:5173`, `:5174`); only needed when the SPA is served from a different origin than the API. |
| `server.error_type_base_uri` | `about:blank` | RFC 9457 error `type` base URI (joined as `<base>/<code>`). |

## Database

| Key | Default | Required | Purpose |
| --- | --- | --- | --- |
| `database.host` | `localhost` | **Yes** | Postgres host. May be a Unix socket path (Cloud SQL) when it starts with `/`. |
| `database.port` | `5432` | **Yes** | Postgres port. |
| `database.user` | `vibexp_app` | **Yes** | Database user. |
| `database.password` | `${DB_PASSWORD}` | **Yes** | Database password (secret — resolved from the environment). |
| `database.name` | `vibexp_io` | **Yes** | Database name. |

See [Database & Migrations](/developer-guide/backend/database/) for pooling and
migration behaviour.

## Security & encryption

| Key | Default | Required | Purpose |
| --- | --- | --- | --- |
| `security.encryption_key` | `${ENCRYPTION_KEY}` | **Yes** | AES-256 key for encrypting sensitive data at rest (API keys, OAuth-AS signing keys). Must be exactly 32 bytes. |
| `security.api_key_common` | `${API_KEY_COMMON}` | No | Shared API key for the common API surface. |
| `security.backoffice_admin_api_key` | `${BACKOFFICE_ADMIN_API_KEY}` | No | Admin key for back-office endpoints (`/bo/*`). Separate from JWTs and regular API keys. |

## Authentication

Selects and configures the web-login identity providers. See
[Authentication](/developer-guide/backend/authentication/) for the full model.

| Key | Default | Purpose |
| --- | --- | --- |
| `auth.providers` | `[]` | Web-login providers to enable **simultaneously**: any of `google`, `github`, `oidc` (case-insensitive). Empty disables web login (dev login still works). Takes precedence over `auth.provider`. |
| `auth.provider` | _(empty)_ | Backward-compatible single-provider shim; used only when `auth.providers` is empty. |
| `auth.session_encryption_key` | `${SESSION_ENCRYPTION_KEY}` | Hex secret (**64 hex chars = 32 bytes**) backing the AES-256-GCM session cookie and the OAuth state HMAC. Empty disables cookie session auth. Generate with `openssl rand -hex 32`. |
| `auth.dev_login_enabled` | `false` when unset (the shipped `config.example.yaml` and baked Docker config set `true`) | Gates `/api/v1/auth/dev/login`. Effective only when `true` **and** the environment is detected as local development. |
| `auth.signin_allowed_emails` | `[]` | Allow-list of emails permitted to sign in. Empty means open registration. |

:::caution
Provider misconfiguration is never fatal: an unknown name in `auth.providers`,
missing credentials, or failed OIDC discovery logs a **warning** and skips that
provider — the backend still boots. The enabled set is exposed at
`GET /api/v1/auth/providers` for the login UI's provider picker.
:::

### Per-provider blocks

Each provider has its own block; set the secret in `.env` and the rest in
`config.yaml`. All redirect URIs default to
`http://localhost:8080/api/v1/auth/callback`.

| Key | Purpose |
| --- | --- |
| `auth.google.client_id` / `auth.google.client_secret` / `auth.google.redirect_uri` | Google OIDC web-login client (reached directly via `accounts.google.com` discovery). |
| `auth.github.client_id` / `auth.github.client_secret` / `auth.github.redirect_uri` | GitHub OAuth2 web-login client (OAuth2, not OIDC; claims come from the GitHub REST API). |
| `auth.oidc.issuer_url` / `auth.oidc.client_id` / `auth.oidc.client_secret` / `auth.oidc.redirect_uri` | Generic OIDC client for any compliant issuer (Keycloak, Authentik, Zitadel, Auth0, …). `issuer_url` drives `/.well-known/openid-configuration` discovery. |

### Embedded OAuth 2.1 Authorization Server (`auth.oauth_as`)

The AS mints the bearer JWTs the MCP endpoint accepts. When `issuer_url` is set
the AS is mounted; empty disables it. In **local development it auto-enables**
at `http://localhost:<server.port>` even when left empty. See
[Authentication → Embedded OAuth 2.1 Authorization Server](/developer-guide/backend/authentication/#the-embedded-oauth-21-authorization-server).

| Key | Default | Purpose |
| --- | --- | --- |
| `auth.oauth_as.issuer_url` | _(empty; auto-derived locally)_ | Public base URL of the AS — becomes the token `iss` and the metadata `issuer`. Must be HTTPS in production. |
| `auth.oauth_as.access_token_ttl` | `15m` | Access-token lifetime. |
| `auth.oauth_as.refresh_token_ttl` | `720h` | Refresh-token lifetime. Must exceed the access-token TTL. |
| `auth.oauth_as.auth_code_ttl` | `10m` | Authorization-code lifetime. |
| `auth.oauth_as.key_rotation_interval` | `720h` | How often the RS256 signing key rotates (coordinated across replicas). |
| `auth.oauth_as.cleanup_interval` | `1h` | How often expired codes, tokens, PKCE and login sessions, and retired signing keys are pruned. |

### API-surface OAuth (`auth.api_oauth`)

When set, `/api/v1/*` accepts issuer-signed bearer JWTs (mobile / native PKCE
clients) alongside session cookies and API keys.

| Key | Default | Purpose |
| --- | --- | --- |
| `auth.api_oauth.issuer` | _(empty)_ | Issuer URL. Empty rejects non-API-key bearer tokens with 401. |
| `auth.api_oauth.audiences` | `[]` | Optional `aud` allow-list. Default accepts any audience **except** the MCP resource URI. |

:::caution
With the default `auth.api_oauth.audiences`, any access token from the issuer
for a provisioned user is an API credential. Never log or forward such tokens.
:::

## MCP OAuth (resource server)

The `/mcp/v1/common` endpoint is an OAuth 2.1 resource server pointed at the
embedded Authorization Server. See
[MCP Server](/developer-guide/backend/mcp-server/).

| Key | Default | Purpose |
| --- | --- | --- |
| `mcp.oauth_issuer` | _(empty; defaults to `auth.oauth_as.issuer_url` when the AS is enabled)_ | Issuer the MCP endpoint trusts; JWKS is fetched from `<issuer>/oauth2/jwks.json`. If set explicitly it must equal the AS issuer. Empty with no AS disables the endpoint (rejects all tokens with 401). |
| `mcp.resource_uri` | _(empty; auto-derived locally as `<issuer>/mcp/v1/common`)_ | Canonical MCP resource identifier and required token audience (RFC 8707). Required when the AS is enabled. |

In local development both fields are auto-derived — leave them empty. In
production set them explicitly (e.g. `https://connect.example.com/mcp/v1/common`).

## Frontend & runtime `/config.js`

The `frontend` block holds the SPA base URL plus deploy-time, non-secret values
the backend serves to the SPA at **`/config.js`** (as
`window.__VIBEXP_ENV__`). Each field mirrors a `VITE_*` value the frontend
would otherwise bake in at build time; empty values fall back to the SPA's
built-in defaults.

| Key | Default | Purpose |
| --- | --- | --- |
| `frontend.base_url` | `http://localhost:5173` | Public URL of the web app (redirects, email links). Also the **local-development detection signal**: a localhost value enables dev-only paths. In the combined image, set it to your public URL. |
| `frontend.site_name` / `frontend.site_legal_name` / `frontend.site_url` | _(empty)_ | Branding shown by the SPA. |
| `frontend.terms_url` / `frontend.privacy_url` / `frontend.support_email` | _(empty)_ | Legal/support links. |
| `frontend.brand_logo_url` | _(empty)_ | Logo URL. |
| `frontend.mcp_endpoint` | _(empty)_ | MCP endpoint URL shown in the connect UI. |
| `frontend.error_type_base_uri` | _(empty)_ | RFC 9457 base URI the SPA links error codes to. |
| `frontend.gtm_id` / `frontend.gtm_enabled` / `frontend.ga4_measurement_id` | _(empty)_ | Optional analytics. GTM is off unless `gtm_enabled` is exactly `"true"`. |

:::danger
`/config.js` is **world-readable** — only non-secret values belong in the
`frontend` block.
:::

## Search ranking

When `recency_ranking_enabled` is `false` (default) results keep
relevance-only ordering; `true` blends relevance and freshness by the weights.
Weights must be non-negative and not all zero; the half-life and candidate cap
must be positive (validated at startup).

| Key | Default | Purpose |
| --- | --- | --- |
| `search.recency_ranking_enabled` | `false` | Enable the weighted relevance/freshness blend. |
| `search.rank_weight_relevance` | `0.5` | Weight of semantic/keyword relevance. |
| `search.rank_weight_created` | `0.3` | Weight of creation recency. |
| `search.rank_weight_updated` | `0.2` | Weight of update recency. |
| `search.rank_half_life_days` | `90.0` | Freshness decay half-life (max 36500). |
| `search.rank_candidate_cap` | `200` | Re-rank candidate pool size (max 5000). |

## Embeddings

Embeddings are generated in-process by an async event-bus worker: text is
chunked in Go, embedded via the active provider, and stored in pgvector. There
is **no** external AI service and **no** message broker.

:::caution[Not in config.yaml since v0.4.0]
There is **no `embedding` block** in `config.yaml`. All embedding settings are
**per-team embedding providers**, managed in the app (Settings) or via
`/api/v1/{team_id}/settings/embedding-providers`. A leftover `embedding:` block
in an old config file is silently ignored.
:::

Each per-team embedding provider stores:

| Setting | Default | Purpose |
| --- | --- | --- |
| `base_url`, `api_key`, `provider_type` | _(required)_ | Any OpenAI-compatible `/v1/embeddings` endpoint: OpenAI, Ollama, LocalAI, vLLM, TEI, and similar. API keys are stored encrypted. |
| `model` | _(set per provider)_ | The `model_id` tag written on every vector row and used as the search filter. |
| `chunk_size` | `1000` | Rune-based chunk size for the in-Go chunker. |
| `chunk_overlap` | `200` | Overlap between chunks (must be smaller than the chunk size). |
| `concurrency` | `1` | Max concurrent embedding requests sent to this provider. |
| `query_prefix` / `document_prefix` | _(empty)_ | Optional prefixes for asymmetric models (mxbai, BGE, E5) prepended to queries and documents. |

Provider behavior:

- Providers are validated on save and must return **1024-dimension** vectors.
  The width is locked to the pgvector column and is not configurable.
- Changing a provider's identity (endpoint or model) **wipes and re-embeds**
  that team's vectors. Coverage, one-click reprocess, and clear-all-embeddings
  actions are available on the settings page and API.
- If no provider is configured, entities are still saved and search falls back
  to keyword (full-text) mode.

Per-team **model providers** (bring-your-own OpenAI-compatible LLM endpoints)
are also managed in-app, under `/api/v1/{team_id}/settings/model-providers`,
not in `config.yaml`.

## Email

| Key | Default | Purpose |
| --- | --- | --- |
| `email.provider` | `smtp` | `smtp`, `mailgun`, `postmark`, or `sendgrid`. |
| `email.from_address` | `dev@vibexp.local` (example file) | Sender address for all providers. Empty falls back to `email.smtp.username`. |
| `email.contact_recipient_address` | _(empty)_ | Inbox for support notification emails. Falls back to `from_address`, then `smtp.username`. |
| `email.privacy_policy_url` | `https://example.com/privacy-policy` | Privacy-policy link in transactional email footers. |

**SMTP** (`email.provider: smtp`). Dev defaults point at Mailpit (UI at
`http://localhost:8025`).

| Key | Dev default | Purpose |
| --- | --- | --- |
| `email.smtp.host` | `localhost` | SMTP host. When the host or port is absent the provider falls back to a no-op stub. |
| `email.smtp.port` | `1025` | SMTP port. |
| `email.smtp.username` | `dev` | SMTP username. |
| `email.smtp.password` | `${SMTP_PASSWORD}` | SMTP password (secret). |

**Mailgun** (`email.provider: mailgun`).

| Key | Purpose |
| --- | --- |
| `email.mailgun.domain` | Mailgun sending domain (required). |
| `email.mailgun.sending_key` | `${MAILGUN_SENDING_KEY}` — private API key (required). |
| `email.mailgun.base_url` | Region base URL; empty uses the US default. |

**Postmark** (`email.provider: postmark`).

| Key | Purpose |
| --- | --- |
| `email.postmark.server_token` | `${POSTMARK_SERVER_TOKEN}` — Server API token (required). |
| `email.postmark.message_stream` | Message stream to send on (default `outbound`). |

**SendGrid** (`email.provider: sendgrid`).

| Key | Purpose |
| --- | --- |
| `email.sendgrid.api_key` | `${SENDGRID_API_KEY}` — API key with the "Mail Send" permission (required). |

## GitHub App

Optional integration (distinct from the `auth.github` web-login client). Leave
empty for local dev — the provider stubs out.

| Key | Default | Purpose |
| --- | --- | --- |
| `github.app_id` | _(empty)_ | App ID from your GitHub App settings. |
| `github.app_slug` | _(empty)_ | The App's URL slug. |
| `github.app_private_key` | `${GITHUB_APP_PRIVATE_KEY}` | Base64-encoded private key (raw PEM also accepted). A non-empty but invalid value fails startup on PEM parsing. |
| `github.webhook_url` | _(empty)_ | Public URL GitHub sends events to. |
| `github.webhook_secret` | `${GITHUB_WEBHOOK_SECRET}` | Secret used to verify webhook payloads. |

## Attachments (GCS)

| Key | Default | Purpose |
| --- | --- | --- |
| `storage.attachments_bucket` | _(empty)_ | GCS bucket for attachments. Empty disables attachments (upload/download/delete return 503). |

## Rate limiting

Per-IP request limits (requests per minute), applied per route group. Each must
be ≥ 1.

| Key | Default | Purpose |
| --- | --- | --- |
| `rate_limit.auth_per_minute` | `100` | Per-IP limit on `/api/v1/auth/*` and the OAuth-AS endpoints. |
| `rate_limit.api_per_minute` | `1000` | Per-IP limit on the authenticated API surface. |

## Retention

| Key | Default | Purpose |
| --- | --- | --- |
| `retention.activity_days` | `90` | Activity-log retention window (1–3650 days). |
| `retention.access_event_days` | `90` | Access-event retention window (1–3650 days). |
| `retention.content_version_limit` | `20` | Content-version snapshots kept per resource. `0` disables pruning (keep every version). |

## A2A (agent-to-agent)

| Key | Default | Purpose |
| --- | --- | --- |
| `a2a.default_timeout` | `5m` | Max time to wait for synchronous agent-to-agent HTTP responses. |
| `a2a.stream_timeout` | `2h` | Max lifetime of a streaming (SSE) agent task. Decoupled from the sync timeout so long-running streams are not cut short. |

## FCM (web push)

| Key | Default | Purpose |
| --- | --- | --- |
| `fcm.enabled` | `false` | Opt-in Firebase Cloud Messaging web-push channel. |

## Deployment environment detection

The `deployment` block holds environment-detection indicators (used to label
telemetry and pick the deployment environment). Most are auto-populated by the
hosting platform; `config.example.yaml` passes them through with
`${VAR:-}` references, so manual setting is rarely needed. Detection order:
`otel_environment`, then `environment`/`env`/`deployment_environment`, then
cloud indicators (`kubernetes_service_host`, `k_service` / `k_revision`
(Cloud Run), `google_cloud_project` / `gcp_project`, `aws_region` /
`aws_default_region`), defaulting to `production`.

## Event bus

Async event processing (embeddings and other post-commit side effects). All
optional with production-tuned defaults; values are validated and capped.

| Key | Default | Max | Purpose |
| --- | --- | --- | --- |
| `event_bus.worker_count` | `20` | `1000` | Concurrent event workers. |
| `event_bus.buffer_size` | `500` | `10000` | Event queue buffer size. |
| `event_bus.max_retries` | `3` | `10` | Max retry attempts per event. |
| `event_bus.retry_backoff` | `200ms` | — | Base retry delay; exponential per attempt. |
| `event_bus.retry_jitter` | `true` | — | Randomize backoff (±10%) to avoid thundering herd. |

## OpenTelemetry

| Key | Default | Purpose |
| --- | --- | --- |
| `otel.endpoint` | `localhost:4317` | OTLP collector endpoint (gRPC `host:port`, no scheme). |
| `otel.export_interval` | `60s` | Metric export interval. |
| `otel.trace_sample_ratio` | `0.1` | Trace sampling ratio. |
| `otel.tracing_enabled` | `false` | Enable trace export. |

## Internal jobs (Pub/Sub OIDC)

OIDC auth for internal job endpoints (`/internal/jobs/*`), e.g. Cloud
Scheduler. Unrelated to embeddings; leave empty for local dev.

| Key | Default | Purpose |
| --- | --- | --- |
| `gcp.project_id` | _(empty)_ | GCP project id, used only for trace/log correlation. |
| `gcp.pubsub_push_audience` | _(empty)_ | Public HTTPS URL the OIDC caller targets; the token's audience must match it. |
| `gcp.pubsub_push_service_account_suffix` | _(empty)_ | Optional. Restrict accepted tokens to a service-account domain (token email must end with this suffix). |
