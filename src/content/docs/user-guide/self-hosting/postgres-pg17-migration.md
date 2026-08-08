---
title: Upgrading Postgres to 17
description: Upgrade guide for v0.10.0, which moves the bundled Postgres image from 16 to 17. Postgres data files are not compatible across major versions, so a populated data volume needs a one-time dump-and-restore (or pg_upgrade) before the new image will start.
sidebar:
  order: 5
---

:::danger[Read this before you pull the new image]
**v0.10.0** moves the bundled Postgres image from **16 to 17**
(`pgvector/pgvector:pg16` → `pgvector/pgvector:pg17`). Postgres **on-disk data
files are not compatible across major versions**: a Postgres 17 image started on
a data directory created by Postgres 16 **refuses to start** with a fatal error
like:

```
FATAL:  database files are incompatible with server
DETAIL:  The data directory was initialized by PostgreSQL version 16,
         which is not compatible with this version 17.x.
```

Your existing data is **not lost** — the container just will not start against
it until you migrate the volume. Do the one-time migration below before pulling.
:::

This only affects instances that already have a populated Postgres **data
volume** (i.e. you have been running VibeXP and have real data). A brand-new
install has nothing to migrate — the fresh volume is initialized by Postgres 17
directly.

## Before you start

- **Take a backup regardless of which path you choose.** The dump you make below
  *is* your backup; if you use `pg_upgrade`, take a `pg_dumpall` first anyway.
- Note your database credentials. In the default `docker-compose.yml` they are
  `POSTGRES_USER=vibexp`, `POSTGRES_DB=vibexp`, and the password you set in
  `POSTGRES_PASSWORD` / `DB_PASSWORD`.
- The commands below assume the published `docker-compose.yml` with services
  named `postgres` and a volume named `pgdata`. Adjust names to match your
  deployment (Helm, systemd, managed Postgres, etc.).

## Path A — dump and restore (recommended)

The most portable path, and the one to use if you are unsure. It works
identically for Docker Compose, Kubernetes, and a managed Postgres.

### 1. Dump the current database while still on Postgres 16

With your **current** (pg16) stack running:

```bash
# Still on the OLD image. Dump the whole cluster to a file on the host.
docker compose exec -T postgres \
  pg_dumpall -U vibexp > vibexp-pg16-dump.sql
```

Keep `vibexp-pg16-dump.sql` safe — it is your restore point.

### 2. Stop the stack and remove the old data volume

```bash
docker compose down
# Remove ONLY the Postgres data volume. Named volume is usually
# "<project>_pgdata"; confirm with `docker volume ls`.
docker volume rm vibexp_pgdata
```

:::caution
`docker compose down -v` removes **all** volumes, including any attachment
storage. Remove only the Postgres data volume by name, as above.
:::

### 3. Pull the new image and start a fresh Postgres 17 volume

Update your image tag to the new release (which pins
`pgvector/pgvector:pg17`), then:

```bash
docker compose pull
# Start ONLY Postgres so it initializes a clean pg17 data directory first.
docker compose up -d postgres
```

Wait for it to become healthy (`docker compose logs -f postgres` → "database
system is ready to accept connections").

### 4. Restore the dump into Postgres 17

```bash
docker compose exec -T postgres \
  psql -U vibexp -d postgres < vibexp-pg16-dump.sql
```

`pg_dumpall` recreates the `vibexp` database and the `vector` / `pg_trgm` /
`pgcrypto` / `uuid-ossp` extensions exactly as they were, so nothing else needs
recreating.

### 5. Start the rest of the stack

```bash
docker compose up -d
```

Confirm the app starts cleanly and your data is present.

## Path B — pg_upgrade (large databases)

If your database is large enough that a dump/restore is impractical, use the
[official `pgautoupgrade`](https://github.com/pgautoupgrade/docker-pgautoupgrade)
approach or run `pg_upgrade` against a copy of the data directory. This keeps the
files in place and is faster for big datasets, but it is fiddlier and does not
cross a filesystem/host boundary. **Still take a `pg_dumpall` backup first** — a
failed in-place upgrade can leave the data directory unusable.

The extensions VibeXP uses (`vector` from pgvector, plus `pg_trgm`, `pgcrypto`,
`uuid-ossp`) are all present in the `pgvector/pgvector:pg17` image, so no
extension needs to be dropped or reinstalled during the upgrade.

## Managed Postgres

If you run Postgres outside the bundled container (a managed service such as RDS,
Cloud SQL, or your own cluster), this release does **not** force you to 17 — the
image pin only governs the Postgres that ships **inside** the combined image's
compose file. VibeXP supports Postgres 16 and 17. Upgrade your managed instance
on your provider's normal major-version-upgrade path whenever you choose; there
is no VibeXP-specific step.

## Verifying

After the upgrade:

- The `app` container starts and stays healthy.
- Your prompts, blueprints, memories, and artifacts are all present.
- Semantic search returns results (this exercises the `vector` and `pg_trgm`
  extensions end to end).

## Checklist

- [ ] `pg_dumpall` backup taken while still on Postgres 16
- [ ] Old `pgdata` volume removed (by name, not `-v`)
- [ ] New image pulled (pins `pgvector/pgvector:pg17`)
- [ ] Fresh Postgres 17 volume initialized and healthy
- [ ] Dump restored into Postgres 17
- [ ] App starts cleanly and data is present
- [ ] Semantic search works
