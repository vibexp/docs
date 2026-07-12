---
title: Docker & Compose
description: A walkthrough of the VibeXP root docker-compose.yml — the postgres and app services, the combined image and its baked config.yaml, the pgdata volume, the bridge network, and the optional GCS service.
---

This page walks through the root
[`docker-compose.yml`](https://github.com/vibexp/vibexp/blob/main/docker-compose.yml),
which runs the published VibeXP image. It is for *running* VibeXP; local
development uses `make` instead (see
[Getting Started](/developer-guide/getting-started/)).

:::note
For the step-by-step quick start and the production hardening checklist, see
[Self-Hosting](/developer-guide/deployment/self-hosting/). This page focuses on
the compose topology.
:::

## Topology

The stack is two services on a single bridge network (`vibexp`):

### `postgres`

```yaml
image: pgvector/pgvector:pg16
```

PostgreSQL 16 with the `pgvector` extension (needed for semantic search). It has
a `pg_isready` healthcheck, and the `app` service waits on
`condition: service_healthy` before starting. Data lives in the `pgdata` named
volume.

### `app`

```yaml
image: ghcr.io/vibexp/vibexp:latest
ports: ["8080:8080"]
```

The **combined image**: the Go backend embeds the built frontend SPA and serves
both from one binary — the SPA at `/`, the REST API at `/api/v1`, and the MCP
endpoint, all on a single port and a single origin. There is no separate
frontend container, no reverse proxy in between, and no CORS to configure.

Its `environment:` block carries the database connection (`DB_HOST: postgres`,
`DB_USER`, `DB_PASSWORD`, `DB_NAME`), the required `ENCRYPTION_KEY`, plus
`SESSION_ENCRYPTION_KEY` (needed for production session auth; empty disables cookie sessions) and the public origin (`FRONTEND_BASE_URL`). Its
healthcheck hits `http://localhost:8080/ping`. See
[Configuration Reference](/developer-guide/deployment/configuration-reference/)
for which of these you must change for production.

## How the env vars work

The image bakes a default configuration file
([`backend/config.docker.yaml`](https://github.com/vibexp/vibexp/blob/main/backend/config.docker.yaml))
at `/app/config.yaml` and points `VIBEXP_CONFIG_FILE` at it. Every operator knob
in that file is a `${VAR:-default}` reference, so the `environment:` block
configures the container with plain env vars — no config file to author. Only
secrets and non-default knobs need to be set; anything omitted falls back to the
baked default.

:::caution
There is no generic environment override: an env var only has an effect if the
loaded `config.yaml` references it as `${VAR}`. Settings the baked file does not
reference (multi-provider `auth.providers` lists, `auth.oauth_as.*` token TTLs,
`auth.signin_allowed_emails`, …) require mounting your own file — see below.
:::

### Taking full control: mount your own `config.yaml`

To control every setting, mount your own file over the baked path and keep only
secrets in the environment. Copy
[`backend/config.example.yaml`](https://github.com/vibexp/vibexp/blob/main/backend/config.example.yaml)
(the complete, commented field list), edit it, and uncomment the `volumes:` on
the `app` service:

```yaml
volumes:
  - ./config.yaml:/app/config.yaml:ro
```

## Running without Compose (`docker run`)

The combined image is self-contained, so a single container works anywhere a
PostgreSQL with pgvector is reachable:

```bash
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host -e DB_PASSWORD=secret \
  -e ENCRYPTION_KEY="$(openssl rand -base64 24 | cut -c1-32)" \
  -e FRONTEND_BASE_URL=https://vibexp.example.com \
  ghcr.io/vibexp/vibexp:0.6.0
```

The baked `FRONTEND_BASE_URL` defaults to **empty** (fail-closed: the dev-login
bypass stays off). To evaluate locally with the dev-login shortcut via a bare
`docker run`, add `-e FRONTEND_BASE_URL=http://localhost:8080` — or just use
`docker compose up`, which sets it for you.

## Image tags

Each GitHub Release with a `vX.Y.Z` tag publishes
`ghcr.io/vibexp/vibexp:X.Y.Z` (e.g. `ghcr.io/vibexp/vibexp:0.6.0`); non-prereleases
also move `:latest`, which `docker-compose.yml` tracks. Since v0.4.0 the image
is **multi-arch**: one manifest covers `linux/amd64` and `linux/arm64`.

:::note[Migrating from pre-v0.3.0]
Releases before v0.3.0 published separate backend and frontend images. Those are
gone: from v0.3.0 the single `ghcr.io/vibexp/vibexp` image replaces both, and the
frontend container (with its reverse proxy and `BACKEND_ORIGIN` variable) no
longer exists.
:::

## Volume

```yaml
volumes:
  pgdata:
```

The named `pgdata` volume holds the database. It **survives**
`docker compose down`. To wipe all data, use `docker compose down -v`.

## Network

Both services share a single user-defined bridge network named `vibexp`, so they
reach each other by service name (the app connects to `postgres:5432`).

## Optional: GCS emulator for attachments

The compose file ships a commented-out `gcs` service
(`fsouza/fake-gcs-server`) for persistent file attachments. To enable uploads:

1. Uncomment the `gcs` service and its `gcsdata` volume.
2. Uncomment `STORAGE_EMULATOR_HOST` and `GCS_RESOURCE_ATTACHMENTS_BUCKET` on the
   `app` service.

Without it, attachment uploads are disabled.

## Lifecycle

```bash
docker compose up -d        # start (pulls the published image on first run)
docker compose ps           # check status
docker compose logs -f      # follow logs
docker compose down         # stop and remove containers (keeps pgdata)
docker compose down -v      # stop and ALSO delete the pgdata volume (wipes data)
```

:::caution
`docker compose down -v` permanently deletes the database. Use plain
`docker compose down` to stop the stack while keeping your data.
:::

## Related

- [Self-Hosting](/developer-guide/deployment/self-hosting/)
- [Configuration Reference](/developer-guide/deployment/configuration-reference/)
- [Self-Hosting (user guide)](/user-guide/self-hosting/)
