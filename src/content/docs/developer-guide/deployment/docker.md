---
title: Docker & Compose
description: A walkthrough of the VibeXP root docker-compose.yml — the postgres, backend, and frontend services, the pgdata volume, the bridge network, and the optional GCS service.
---

This page walks through the root
[`docker-compose.yml`](https://github.com/vibexp/vibexp/blob/main/docker-compose.yml),
which runs the published VibeXP images. It is for *running* VibeXP; local
development uses `make` instead (see
[Getting Started](/developer-guide/getting-started/)).

:::note
For the step-by-step quick start and the production hardening checklist, see
[Self-Hosting](/developer-guide/deployment/self-hosting/). This page focuses on
the compose topology.
:::

## Topology

The stack is three services on a single bridge network (`vibexp`):

### `postgres`

```yaml
image: pgvector/pgvector:pg16
```

PostgreSQL 16 with the `pgvector` extension (needed for semantic search). It has
a `pg_isready` healthcheck, and the `backend` service waits on
`condition: service_healthy` before starting. Data lives in the `pgdata` named
volume.

### `backend`

```yaml
image: ghcr.io/vibexp/backend:latest
ports: ["8080:8080"]
```

The Go API and MCP endpoint. Its environment carries the database connection
(`DB_HOST: postgres`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), the required
`ENCRYPTION_KEY`, the public URLs (`FRONTEND_BASE_URL`, `CORS_ALLOWED_ORIGINS`),
and auth settings (`DEV_LOGIN_ENABLED`, WorkOS). Its healthcheck hits
`http://localhost:8080/ping`. See
[Configuration Reference](/developer-guide/deployment/configuration-reference/)
for which of these you must change for production.

### `frontend`

```yaml
image: ghcr.io/vibexp/frontend:latest
ports: ["5173:80"]
environment:
  BACKEND_ORIGIN: "http://backend:8080"
```

The nginx-served SPA. It calls a relative `/api` base, and nginx reverse-proxies
that to `BACKEND_ORIGIN` — the only runtime variable it needs. It waits on the
backend's healthcheck before starting. Container port 80 is published on host
port `5173`.

## Volume

```yaml
volumes:
  pgdata:
```

The named `pgdata` volume holds the database. It **survives**
`docker compose down`. To wipe all data, use `docker compose down -v`.

## Network

All services share a single user-defined bridge network named `vibexp`, so they
reach each other by service name (e.g. the backend connects to `postgres:5432`,
nginx proxies to `backend:8080`).

## Optional: GCS emulator for attachments

The compose file ships a commented-out `gcs` service
(`fsouza/fake-gcs-server`) for persistent file attachments. To enable uploads:

1. Uncomment the `gcs` service and its `gcsdata` volume.
2. Uncomment `STORAGE_EMULATOR_HOST` and `GCS_RESOURCE_ATTACHMENTS_BUCKET` on the
   `backend` service.

Without it, attachment uploads are disabled.

## Lifecycle

```bash
docker compose up -d        # start (pulls published images on first run)
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
- [Frontend Building & Serving](/developer-guide/frontend/building/)
