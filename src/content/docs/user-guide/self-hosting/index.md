---
title: Self-Hosting
description: Run your own VibeXP instance on your own infrastructure and domain with Docker Compose. Covers the env-var matrix, authentication options, embeddings, and object storage.
---

VibeXP is designed to be self-hosted on your own infrastructure and domain. There is **no committed secret or infrastructure-specific value** in the repository — every deployment supplies its own configuration through environment variables.

:::tip[Canonical reference]
This page summarizes the deployment setup in the [`vibexp/vibexp`](https://github.com/vibexp/vibexp) repository — its root `docker-compose.yml` and `backend/.env.example` are the canonical, always-current source for the authoritative env-var list.
:::

## Prerequisites

- **Docker + Docker Compose** (for the quick start), **or** Node 20+ / Go 1.25+ for local dev.
- **PostgreSQL 15/16 with the [`pgvector`](https://github.com/pgvector/pgvector) extension** (the bundled compose file uses `pgvector/pgvector:pg16`).
- A **WorkOS** account for production login (see [Authentication](#authentication)), or use the dev-login bypass for local evaluation.
- *(For semantic search)* an OpenAI-compatible embeddings endpoint configured in-app — see [Search and embeddings](#search-and-embeddings). No external embedding service is required to boot.

## Quick start

```bash
git clone https://github.com/vibexp/vibexp.git
cd vibexp
cp backend/.env.example backend/.env   # then edit the required values
docker compose up -d
```

The root `docker-compose.yml` runs the published `ghcr.io/vibexp/*` images plus a PostgreSQL (pgvector) database. Edit `backend/.env` with your own values before exposing it publicly. By default the frontend serves on `http://localhost:5173` and the API on `http://localhost:8080`.

## Your domains

The application's API, app, and MCP URLs are **yours** — they are not hardcoded. Throughout this documentation we use deployment-agnostic placeholders: `<your-vibexp-host>` for the app, `<your-api-host>` for the API, and `<your-mcp-host>` for the MCP endpoint. Set them per deployment:

| Concern | Env var | Notes |
| --- | --- | --- |
| Backend API origin | `VITE_API_BASE_URL` (frontend build arg) | e.g. `https://<your-api-host>/api/v1` |
| Allowed CORS origins | `CORS_ALLOWED_ORIGINS` (backend) | your frontend origin(s) |
| Frontend base URL | `FRONTEND_BASE_URL` (backend) | used for auth redirects + email links |
| MCP resource URI | `MCP_RESOURCE_URI` (backend) | your MCP endpoint |

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

Production login uses **WorkOS AuthKit**. Provide:

- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_REDIRECT_URI`
- `WORKOS_COOKIE_PASSWORD` (64 hex chars = 32 bytes)

For **local evaluation without WorkOS**, set `DEV_LOGIN_ENABLED=true` (only honored with a `localhost` `FRONTEND_BASE_URL`) plus `WORKOS_COOKIE_PASSWORD`.

:::note[Generic OIDC]
Beyond WorkOS, a generic OIDC provider (Keycloak / Zitadel / Auth0 / …) is supported: set `AUTH_PROVIDER=oidc` and supply the `OIDC_*` variables. WorkOS AuthKit remains the documented production default.
:::

## Search and embeddings

Embeddings are generated **in-process** — an event-bus worker chunks, embeds, and stores content in pgvector. There is **no external AI service** to run and no `AI_SERVICE_URL`.

The embedding provider (any OpenAI-compatible embeddings endpoint) is configured **in-app**, not via environment variables: add it under the embedding-provider settings inside VibeXP. The embedding vector width is **fixed at 1024** in code, locked to the pgvector column — there is no `EMBEDDING_DIMENSIONS` setting and no `vector(768)`. `EMBEDDING_MODEL` only tags the model id and acts as a search filter.

:::caution
Without a configured embedding provider, CRUD operations still work, but **semantic search is unavailable**.
:::

## Optional integrations

All disabled by default, enabled by setting their env vars (see `backend/.env.example`):

| Integration | Enable via | Behavior when off |
| --- | --- | --- |
| **Object storage** (attachments) | S3 / GCS / MinIO via `STORAGE_EMULATOR_HOST` + bucket | Uploads return `503` |
| **Email** | `EMAIL_PROVIDER=smtp` + `SMTP_*` (or Mailgun) | Email features disabled |
| **Web push** | `FCM_ENABLED`, `VITE_FIREBASE_*` (Firebase Cloud Messaging) | Push disabled |
| **Analytics** | `*_GTM_ID` (Google Tag Manager / GA4) | No analytics |
| **Error tracking** | Sentry DSN | No error reporting |
| **Telemetry** | `OTEL_*` (any OTLP collector) | No telemetry |

## Branding

The "VibeXP" name and logo are the project maintainer's brand. To white-label a fork, override the site config env vars (`VITE_SITE_NAME`, `VITE_BRAND_*`, `PUBLIC_ORG_NAME`, etc. — see each site's `.env.example`) and replace the brand assets under each service's `public/` and `design-system/brand/`.

## Next steps

- [Open Source](/user-guide/open-source/) — license model and where to file issues.
- [Contributing](/user-guide/contributing/) — set up a dev environment and open a PR.
