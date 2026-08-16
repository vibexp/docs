---
title: Docker & Compose
description: A walkthrough of the VibeXP root docker-compose.yml, covering the postgres and app services, the combined image and its baked config.yaml, the pgdata volume, the bridge network, and the optional attachment stores.
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
image: pgvector/pgvector:pg17
```

PostgreSQL 17 with the `pgvector` extension (needed for semantic search). It has
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
`SESSION_ENCRYPTION_KEY` (needed for production session auth; empty disables cookie sessions) and the public origin (`FRONTEND_BASE_URL`). Other baked
operator knobs include `DB_SSLMODE` (`require` for managed Postgres TLS),
`INSTANCE_ADMIN_EMAILS` (grants the admin portal),
`AUTH_ALLOWED_DOMAINS` / `AUTH_ALLOWED_EMAILS` (restrict sign-in), the
attachment-store selector `STORAGE_BACKEND` with its per-backend knobs
(`STORAGE_FS_ROOT_DIR`, or `GCS_RESOURCE_ATTACHMENTS_BUCKET` / `S3_ENDPOINT` /
`S3_REGION` / `S3_ACCESS_KEY` / `S3_SECRET_KEY`; see
[Optional: file attachments](#optional-file-attachments)), and
`SCHEDULER_ENABLED` (on by default; drives per-team resource-freshness
evaluation). Its
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
…) require mounting your own file (see below).
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
  ghcr.io/vibexp/vibexp:0.11.0
```

The baked `FRONTEND_BASE_URL` defaults to **empty** (fail-closed: the dev-login
bypass stays off). To evaluate locally with the dev-login shortcut via a bare
`docker run`, add `-e FRONTEND_BASE_URL=http://localhost:8080` — or just use
`docker compose up`, which sets it for you.

## Image tags

Each GitHub Release with a `vX.Y.Z` tag publishes
`ghcr.io/vibexp/vibexp:X.Y.Z` (e.g. `ghcr.io/vibexp/vibexp:0.11.0`). Since v0.4.0
the image is **multi-arch**: one manifest covers `linux/amd64` and
`linux/arm64`.

`:latest`, which `docker-compose.yml` tracks, points at the **highest published
version**, not the most recent build. A prerelease never moves it, and neither
does a backport patch on an older line: publishing `0.10.1` after `0.11.0` is out
leaves `:latest` on `0.11.0` rather than downgrading everyone who tracks it.

:::note[Migrating from pre-v0.3.0]
Releases before v0.3.0 published separate backend and frontend images. Those are
gone: from v0.3.0 the single `ghcr.io/vibexp/vibexp` image replaces both, and the
frontend container (with its reverse proxy and `BACKEND_ORIGIN` variable) no
longer exists.
:::

## Volumes

```yaml
volumes:
  pgdata:
  # attachmentdata:
  # miniodata:
```

The named `pgdata` volume holds the database. It **survives**
`docker compose down`. To wipe all data, use `docker compose down -v`.

The other two are commented out and belong to the optional attachment stores
below: `attachmentdata` backs the filesystem backend, `miniodata` backs the
MinIO server.

## Network

Both services share a single user-defined bridge network named `vibexp`, so they
reach each other by service name (the app connects to `postgres:5432`).

## Optional: file attachments

File uploads need an object store. Without one, attachment uploads (and
downloads and deletes) return **503**. The compose file ships three
commented-out options on the `app` service; pick one.

### (a) Local filesystem, the simplest

Uncomment on the `app` service:

```yaml
STORAGE_BACKEND: "filesystem"
STORAGE_FS_ROOT_DIR: "/data/attachments"
```

then uncomment the volume mount on `app` and the named volume:

```yaml
volumes:
  - attachmentdata:/data/attachments
```

The root directory is created at startup if missing. Mount a volume at that
path or attachments disappear when the container is recreated.

### (b) MinIO (S3-compatible), alongside the stack

Uncomment the `minio` and `createbucket` services. `minio/minio` ships the
server only (`command: server /data`, data on the `miniodata` volume), so the
one-shot `createbucket` service uses the separate `minio/mc` client image to
create `local/vibexp-attachments`. Then uncomment on `app`:

```yaml
STORAGE_BACKEND: "s3"
GCS_RESOURCE_ATTACHMENTS_BUCKET: "vibexp-attachments"
S3_ENDPOINT: "http://minio:9000"
S3_REGION: "us-east-1"
S3_ACCESS_KEY: "minioadmin"
S3_SECRET_KEY: "minioadmin"
```

:::caution[MinIO also needs a mounted `config.yaml`]
MinIO requires path-style addressing, and `storage.s3_path_style` is a boolean
that string-only `${VAR}` interpolation cannot express, so the baked config
carries a literal `false` and there is no env var for it. Mount your own
`config.yaml` (see above) with `storage.s3_path_style: true`, or use option (a)
instead.
:::

### (c) Google Cloud Storage

Set `GCS_RESOURCE_ATTACHMENTS_BUCKET` and leave `STORAGE_BACKEND` unset: the
empty selector still auto-detects GCS from the bucket. Credentials come from
Application Default Credentials. `STORAGE_EMULATOR_HOST` is read by the Google
SDK itself and only applies when pointing at a GCS emulator.

A selected backend missing its required knob (bucket, region, or root
directory) fails startup rather than silently disabling uploads.

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
