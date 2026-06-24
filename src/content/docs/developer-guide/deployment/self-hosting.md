---
title: Self-Hosting
description: Run the published VibeXP stack with Docker Compose — quick start, what runs, evaluating with dev-login, and the hardening checklist before exposing it publicly.
---

VibeXP self-hosts with Docker Compose. The root
[`docker-compose.yml`](https://github.com/vibexp/vibexp/blob/main/docker-compose.yml)
runs the **published** backend and frontend images plus PostgreSQL — it is for
*running* VibeXP, not developing it (local development uses `make`; see
[Getting Started](/developer-guide/getting-started/)).

:::tip[Looking for the end-user version?]
There is also a user-facing [Self-Hosting](/user-guide/self-hosting/) guide. This
page is the developer-guide deployment reference with the full hardening detail.
:::

## Prerequisites

- **Docker** with the **Compose** plugin (`docker compose`).

## Quick start

```bash
git clone https://github.com/vibexp/vibexp.git
cd vibexp
docker compose up -d
```

Then open:

- **App:** http://localhost:5173
- **API health:** http://localhost:8080/health

Local evaluation uses a dev-login bypass, so there is nothing to configure to
start clicking around.

## What runs

`docker compose up -d` starts three services:

| Service | Image | Purpose |
|---|---|---|
| `postgres` | `pgvector/pgvector:pg16` | Database with the `pgvector` extension, with a healthcheck. |
| `backend` | `ghcr.io/vibexp/backend:latest` | Go REST API + MCP endpoint, on port `8080`. |
| `frontend` | `ghcr.io/vibexp/frontend:latest` | nginx-served SPA, on `5173:80`, proxying `/api/` to the backend. |

Data persists in the named volume **`pgdata`**, so it survives
`docker compose down`. The compose healthcheck hits the backend's `/ping`
endpoint; the public health URL is `/health`.

See [Docker & Compose](/developer-guide/deployment/docker/) for the full topology
walkthrough.

## Evaluating with dev-login

For local evaluation, the backend runs with `DEV_LOGIN_ENABLED=true`. This bypass
**only works with a localhost `FRONTEND_BASE_URL`** and lets you sign in without
a WorkOS account. It is for evaluation only — turn it off before any real
deployment.

## Before exposing it publicly

:::danger
The defaults in `docker-compose.yml` are for local evaluation only. For any real
deployment, edit the `backend` service environment before exposing it to the
internet.
:::

- **`ENCRYPTION_KEY`** — required; **exactly 32 bytes** (AES-256). Generate one:
  ```bash
  openssl rand -base64 24 | cut -c1-32
  ```
- **`DB_PASSWORD`** — change it from the default (and keep it in sync with the
  `postgres` service's `POSTGRES_PASSWORD`).
- **`DEV_LOGIN_ENABLED`** — set to `false` and configure
  [WorkOS AuthKit](https://workos.com): `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
  `WORKOS_REDIRECT_URI` (and `WORKOS_COOKIE_PASSWORD`).
- **`FRONTEND_BASE_URL` / `CORS_ALLOWED_ORIGINS`** — set to your real public
  URLs (e.g. `https://<your-app-host>`).

For MCP-specific origins and the full backend variable list, see the
[Configuration Reference](/developer-guide/deployment/configuration-reference/)
and [Backend Configuration](/developer-guide/backend/configuration/).

## Optional: file attachments

File uploads need GCS-compatible object storage. The compose file ships a
commented-out **GCS emulator** (`fsouza/fake-gcs-server`). To enable uploads,
uncomment the `gcs` service and the `STORAGE_EMULATOR_HOST` /
`GCS_RESOURCE_ATTACHMENTS_BUCKET` variables on the `backend` service. See
[Docker & Compose](/developer-guide/deployment/docker/).

## Optional: semantic search

Embeddings are generated **in-process** — there is no separate AI service. The
embedding vector width is **fixed at 1024 in code** (locked to the pgvector
column), so pick a model that outputs 1024 dimensions. The embedding provider is
configured **in the app** (an OpenAI-compatible endpoint), not via environment
variables. Without a configured provider, embedding is skipped and entities still
save — only semantic search is unavailable.

## Related

- [Configuration Reference](/developer-guide/deployment/configuration-reference/)
- [Docker & Compose](/developer-guide/deployment/docker/)
- [Backend Configuration](/developer-guide/backend/configuration/)
