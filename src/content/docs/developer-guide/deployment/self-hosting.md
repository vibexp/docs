---
title: Self-Hosting
description: Run the published VibeXP image with Docker Compose — quick start, what runs, evaluating with dev-login, and the hardening checklist before exposing it publicly.
---

VibeXP self-hosts with Docker Compose. The root
[`docker-compose.yml`](https://github.com/vibexp/vibexp/blob/main/docker-compose.yml)
runs the **published** combined image plus PostgreSQL — it is for
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

- **App:** http://localhost:8080
- **API health:** http://localhost:8080/health

Local evaluation uses a dev-login bypass, so there is nothing to configure to
start clicking around.

## What runs

`docker compose up -d` starts two services:

| Service | Image | Purpose |
|---|---|---|
| `postgres` | `pgvector/pgvector:pg16` | Database with the `pgvector` extension, with a healthcheck. |
| `app` | `ghcr.io/vibexp/vibexp:latest` | The combined image: the Go backend embeds the frontend SPA and serves it, the REST API, and the MCP endpoint from one port (`8080`), same origin. |

Data persists in the named volume **`pgdata`**, so it survives
`docker compose down`. The compose healthcheck hits the app's `/ping`
endpoint; the public health URL is `/health`.

See [Docker & Compose](/developer-guide/deployment/docker/) for the full topology
walkthrough.

## How configuration works

The backend reads a single required `config.yaml`. The published image bakes a
production-neutral default at `/app/config.yaml` whose every value is a
`${VAR:-default}` reference, so the compose file's `environment:` block on the
`app` service configures it with plain env vars. To control every setting
instead, mount your own `config.yaml` over the baked path (there is a commented
`volumes:` entry on the `app` service) — start from `backend/config.example.yaml`.

Compose is optional: with a reachable pgvector-enabled PostgreSQL, a single
`docker run -p 8080:8080 -e DB_HOST=... ghcr.io/vibexp/vibexp:0.3.0` works
anywhere. See
[Docker & Compose](/developer-guide/deployment/docker/) and the
[Configuration Reference](/developer-guide/deployment/configuration-reference/).

## Evaluating with dev-login

The baked config ships with `auth.dev_login_enabled: true`, but the bypass
**only works while `FRONTEND_BASE_URL` points at localhost** (the compose file
sets `http://localhost:8080`), letting you sign in without any identity
provider. Setting a real, non-localhost `FRONTEND_BASE_URL` automatically turns
it off.

## Before exposing it publicly

:::danger
The defaults in `docker-compose.yml` are for local evaluation only. For any real
deployment, edit the `app` service environment before exposing it to the
internet.
:::

- **`FRONTEND_BASE_URL`** — set your real public URL (e.g.
  `https://<your-app-host>`) **first**. It is the single origin serving both the
  SPA and the API, and pointing it away from `localhost` is what disables the
  dev-login bypass. Leave it at `localhost` while exposing the app and dev login
  stays open.
- **`ENCRYPTION_KEY`** — required; **exactly 32 bytes** (AES-256). Generate one:
  ```bash
  openssl rand -base64 24 | cut -c1-32
  ```
- **`DB_PASSWORD`** — change it from the default (and keep it in sync with the
  `postgres` service's `POSTGRES_PASSWORD`).
- **`SESSION_ENCRYPTION_KEY`** — 64 hex chars (32 bytes) backing the session
  cookie. Generate one: `openssl rand -hex 32`.
- **An identity provider** — set `AUTH_PROVIDER` to `google`, `github`, or
  `oidc` with the matching `*_CLIENT_ID` / `*_CLIENT_SECRET` (and
  `*_REDIRECT_URI` if it differs from
  `<FRONTEND_BASE_URL>/api/v1/auth/callback`). For several providers at once,
  mount a `config.yaml` with `auth.providers: [...]`.
- **MCP auth (optional)** — set `OAUTH_AS_ISSUER_URL` (your public HTTPS URL)
  **and** `MCP_RESOURCE_URI` (`<url>/mcp/v1/common`) to enable the embedded
  OAuth 2.1 Authorization Server that issues MCP tokens. In production its
  endpoints **reject plain HTTP** (only localhost is exempt): terminate TLS at
  your reverse proxy / load balancer and forward the original scheme as
  `X-Forwarded-Proto: https`.

For the full setting list, see the
[Configuration Reference](/developer-guide/deployment/configuration-reference/)
and [Backend Configuration](/developer-guide/backend/configuration/).

## Optional: file attachments

File uploads need GCS-compatible object storage. The compose file ships a
commented-out **GCS emulator** (`fsouza/fake-gcs-server`). To enable uploads,
uncomment the `gcs` service and the `STORAGE_EMULATOR_HOST` /
`GCS_RESOURCE_ATTACHMENTS_BUCKET` variables on the `app` service. See
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
