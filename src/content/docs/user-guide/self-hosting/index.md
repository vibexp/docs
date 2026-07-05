---
title: Self-Hosting
description: Run your own VibeXP instance on your own infrastructure and domain with Docker Compose. Covers the configuration model, authentication options, embeddings, and object storage.
---

VibeXP is designed to be self-hosted on your own infrastructure and domain. There is **no committed secret or infrastructure-specific value** in the repository — every deployment supplies its own configuration through environment variables (or its own `config.yaml`).

:::tip[Canonical reference]
This page summarizes the deployment setup in the [`vibexp/vibexp`](https://github.com/vibexp/vibexp) repository — its root `docker-compose.yml` and `backend/config.example.yaml` are the canonical, always-current source for the authoritative setting list.
:::

## Prerequisites

- **Docker + Docker Compose** (for the quick start), **or** Node 20+ / Go 1.25+ for local dev.
- **PostgreSQL 15/16 with the [`pgvector`](https://github.com/pgvector/pgvector) extension** (the bundled compose file uses `pgvector/pgvector:pg16`).
- A **login provider** for production sign-in — Google, GitHub, or any OIDC provider (see [Authentication](#authentication)) — or use the dev-login bypass for local evaluation.
- *(For semantic search)* an OpenAI-compatible embeddings endpoint configured in-app — see [Search and embeddings](#search-and-embeddings). No external embedding service is required to boot.

## Quick start

```bash
git clone https://github.com/vibexp/vibexp.git
cd vibexp
docker compose up -d
```

The root `docker-compose.yml` runs the published combined `ghcr.io/vibexp/vibexp` image plus a PostgreSQL (pgvector) database. The app and the API share **one port**: open `http://localhost:8080` (API under `/api/v1`, same origin — no separate frontend URL). To configure it, edit the `environment:` block on the `app` service in `docker-compose.yml` before exposing it publicly (`backend/.env` is only used by the `make`-based local dev workflow, not by compose).

## How configuration works

The backend reads a single required `config.yaml`. The published image bakes a default at `/app/config.yaml` whose every value is a `${VAR:-default}` reference, so **environment variables alone configure a container** — that is what the compose `environment:` block feeds. To control every setting, mount your own file over `/app/config.yaml` (start from `backend/config.example.yaml`). Compose is optional; with a reachable pgvector-enabled PostgreSQL, one container is enough:

```bash
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host -e DB_PASSWORD=secret \
  -e ENCRYPTION_KEY="$(openssl rand -base64 24 | cut -c1-32)" \
  -e FRONTEND_BASE_URL=https://<your-vibexp-host> \
  ghcr.io/vibexp/vibexp:latest
```

## Your domains

The application's URLs are **yours** — they are not hardcoded. Throughout this documentation we use the deployment-agnostic placeholder `<your-vibexp-host>` for your instance. The app, API, and MCP endpoint all live on that **one origin** (the combined image serves the SPA, `/api/v1`, and `/mcp/v1/common` from the same port — no CORS to configure). Set it per deployment:

| Concern | Env var | Notes |
| --- | --- | --- |
| Public base URL | `FRONTEND_BASE_URL` | the single origin serving app + API; drives auth redirects + email links |
| MCP auth issuer | `OAUTH_AS_ISSUER_URL` | your public HTTPS URL; enables the embedded MCP OAuth server |
| MCP resource URI | `MCP_RESOURCE_URI` | your MCP endpoint, e.g. `https://<your-vibexp-host>/mcp/v1/common` |

The marketing **website**, **blog**, and **docs-site** are independent static sites; their public URLs and branding are configurable via their own `VITE_*` / `PUBLIC_*` env vars (see each service's `.env.example`).

## Required configuration (backend)

These are the only hard requirements to boot the backend. Everything else is optional and stays disabled until configured.

| Env var | Required | Purpose |
| --- | --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ✅ | PostgreSQL connection (must have `pgvector`) |
| `ENCRYPTION_KEY` | ✅ | AES-256 at-rest key — **exactly 32 bytes** |
| `EMBEDDING_MODEL` | Optional | Model-id tag stored on embeddings and used as a search filter (defaults to `gemini-embedding-001`). It does **not** change the vector width, which is fixed at 1024 in code. |

:::note
Database migrations run automatically on boot.
:::

## Authentication

VibeXP is **provider-agnostic** and brings its **own embedded OAuth 2.1 Authorization Server** in-house to secure the MCP endpoint — no third-party auth service required. Choose **Google**, **GitHub**, or a **generic OIDC** provider (Keycloak / Zitadel / Auth0 / Okta / …) via `AUTH_PROVIDER`:

```bash
AUTH_PROVIDER=google                # one of: google, github, oidc
SESSION_ENCRYPTION_KEY=<64 hex>     # encrypts the vx_session cookie
```

To enable **several providers at once**, mount your own `config.yaml` over `/app/config.yaml` with a provider list — the multi-provider `auth.providers` field is not settable via env vars:

```yaml
auth:
  providers: ["google", "github"]
```

For **local evaluation without a provider**, keep the default `localhost` `FRONTEND_BASE_URL` — the dev-login bypass is on by default and only works on localhost.

➡️ See **[Authentication & MCP Auth](/user-guide/self-hosting/authentication/)** for per-provider setup, the embedded Authorization Server, the full env-var matrix, and the HTTPS expectation.

## Search and embeddings

Embeddings are generated **in-process** — an event-bus worker chunks, embeds, and stores content in pgvector. There is **no external AI service** to run and no `AI_SERVICE_URL`.

The embedding provider (any OpenAI-compatible embeddings endpoint) is configured **in-app**, not via environment variables: add it under the embedding-provider settings inside VibeXP. The embedding vector width is **fixed at 1024** in code, locked to the pgvector column — there is no `EMBEDDING_DIMENSIONS` setting and no `vector(768)`. `EMBEDDING_MODEL` only tags the model id and acts as a search filter.

:::caution
Without a configured embedding provider, CRUD operations still work, but **semantic search is unavailable**.
:::

## Optional integrations

All disabled by default, enabled via env vars or a mounted `config.yaml` (see `backend/config.example.yaml`):

| Integration | Enable via | Behavior when off |
| --- | --- | --- |
| **Object storage** (attachments) | GCS-compatible storage: `GCS_RESOURCE_ATTACHMENTS_BUCKET` (+ `STORAGE_EMULATOR_HOST` for an emulator) | Uploads return `503` |
| **Email** | `EMAIL_PROVIDER` (`smtp`, `mailgun`, `postmark`, `sendgrid`) + the provider's credentials | Email features disabled |
| **Web push** | `fcm.enabled` in a mounted `config.yaml` (Firebase Cloud Messaging) | Push disabled |
| **Analytics** | `VITE_GTM_ENABLED` + `VITE_GTM_ID` / `VITE_GA4_MEASUREMENT_ID` (Google Tag Manager / GA4) | No analytics |
| **Telemetry** | `otel.*` in a mounted `config.yaml` (any OTLP collector) | No telemetry |

## Branding

The "VibeXP" name and logo are the project maintainer's brand. To white-label the app, set the branding env vars on the `app` service (`VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_BRAND_LOGO_URL`, …) — they are served to the SPA at runtime via `/config.js`, so a restart applies them without a rebuild. The independent static sites (website, blog, docs) have their own `VITE_*` / `PUBLIC_*` env vars in their repos.

## Next steps

- [Open Source](/user-guide/open-source/) — license model and where to file issues.
- [Contributing](/user-guide/contributing/) — set up a dev environment and open a PR.
