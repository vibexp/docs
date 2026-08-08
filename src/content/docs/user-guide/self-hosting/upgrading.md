---
title: Upgrading
description: Breaking changes in VibeXP releases and the migration each one needs, newest first. Anything listed here requires action before the new image will start.
---

Most VibeXP releases upgrade in place: pull the new image, restart, done. This
page lists the exceptions.

## Versioning and support

VibeXP publishes one image, `ghcr.io/vibexp/vibexp`, tagged `X.Y.Z` per release.

| Tag | Points at |
| --- | --- |
| `X.Y.Z` | that exact release, immutable |
| `latest` | the newest release |

The bundled `docker-compose.yml` tracks `latest`. Pin to `X.Y.Z` instead if you
want upgrades to be a deliberate step:

```yaml
image: ghcr.io/vibexp/vibexp:0.9.0
```

**Patch releases are supported on the newest minor line only.** Once `0.10.0`
ships, fixes go to `0.10.x`, not `0.9.x`. To stay on a supported version, follow
the newest minor.

A patch release (`0.9.0` to `0.9.1`) contains bug fixes and security fixes only.
It never adds a database migration and never changes the API, so it is always a
straight image bump with no action on your side. Anything that needs a schema or
API change ships as a minor release and appears below if it requires action.

**Anything below requires action *before* the new image will start.** Each entry
links to a full migration guide with the exact steps. Entries are newest first:
if you are skipping several releases, work upwards from the version you are on
and apply every migration in between.

## Breaking changes

### Bundled Postgres upgraded from 16 to 17

The Postgres image shipped in the combined-image `docker-compose.yml` moved from
`pgvector/pgvector:pg16` to `pgvector/pgvector:pg17`. Postgres data files are
**not compatible across major versions**, so a Postgres 17 image started on a
data directory created by Postgres 16 refuses to start. If you run the bundled
Postgres with a populated data volume, you must dump-and-restore (or
`pg_upgrade`) the volume once before pulling the new image. Managed / external
Postgres is unaffected — VibeXP supports both 16 and 17.

→ [Upgrading Postgres to 17](/user-guide/self-hosting/postgres-pg17-migration/)

### GitHub App configuration moved to per-team settings

GitHub App credentials used to be instance-wide: one App in `config.yaml`,
shared by every team. They are now registered **per team** and stored encrypted
in the database. You must delete the top-level `github:` section from your
`config.yaml` or the backend refuses to start, drop the `GITHUB_APP_*` /
`GITHUB_WEBHOOK_*` environment variables, and re-register the App on each team
that uses the integration.

This does **not** affect `auth.github`, the GitHub web-login OAuth client.

→ [Migrating to per-team GitHub Apps](/user-guide/self-hosting/github-app-migration/)
