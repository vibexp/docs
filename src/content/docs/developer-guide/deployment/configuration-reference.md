---
title: Configuration Reference
description: An index of VibeXP deployment configuration — the production-critical variables you must set, with links to the full backend and frontend references.
---

This page orients you to VibeXP's configuration. It summarizes the
**production-critical** variables and points to the full references — it does not
duplicate every backend variable.

## Must-set production variables

These are the backend (`docker-compose.yml`) variables you **must** review before
exposing VibeXP to the internet. Defaults are for local evaluation only.

| Variable | Why it matters |
|---|---|
| `ENCRYPTION_KEY` | Required. **Exactly 32 bytes** (AES-256). Generate: `openssl rand -base64 24 \| cut -c1-32`. |
| `DB_PASSWORD` | Change from the default; keep in sync with Postgres `POSTGRES_PASSWORD`. |
| `DEV_LOGIN_ENABLED` | Set to `false` for any real deployment (the dev-login bypass is localhost-only). |
| `WORKOS_API_KEY` | Required once dev-login is off — WorkOS AuthKit credential. |
| `WORKOS_CLIENT_ID` | WorkOS AuthKit client ID. |
| `WORKOS_REDIRECT_URI` | WorkOS callback URL, e.g. `https://<your-api-host>/api/v1/auth/callback`. |
| `WORKOS_COOKIE_PASSWORD` | Session cookie secret. |
| `FRONTEND_BASE_URL` | Your real public app URL, e.g. `https://<your-app-host>`. |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins, e.g. `https://<your-app-host>`. |
| `MCP_*` | Set if you expose the MCP endpoint publicly (advertised MCP host/origins). |

:::caution
Changing `DB_PASSWORD` after the first run does not retroactively change an
already-initialized database. Set it before the first `docker compose up`, or
reset the data volume (`docker compose down -v`) if you change it later.
:::

## Frontend variables

The frontend is configured at **build** time (`VITE_*`) except for the single
runtime variable `BACKEND_ORIGIN`, which nginx uses to locate the backend. For
self-hosting with the published image, `BACKEND_ORIGIN` is typically the only
frontend variable you set.

→ Full list: [Frontend Configuration](/developer-guide/frontend/configuration/).

## Backend variables

The backend has many more variables than the production-critical subset above
(database tuning, logging, storage, MCP, auth).

→ Full list: [Backend Configuration](/developer-guide/backend/configuration/).

## Optional services

- **Semantic search** — embeddings run in-process; vector width is fixed at
  **1024**. Configure an embedding provider **in the app**, not via environment.
- **File attachments** — enable the GCS emulator service and the related backend
  variables. See [Docker & Compose](/developer-guide/deployment/docker/).

## Related

- [Self-Hosting](/developer-guide/deployment/self-hosting/)
- [Docker & Compose](/developer-guide/deployment/docker/)
