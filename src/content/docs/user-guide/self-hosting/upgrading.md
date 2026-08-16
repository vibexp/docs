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
| `latest` | the highest published version, not the most recent build: a backport patch on an older line never moves it |

The bundled `docker-compose.yml` tracks `latest`. Pin to `X.Y.Z` instead if you
want upgrades to be a deliberate step:

```yaml
image: ghcr.io/vibexp/vibexp:0.11.0
```

**Patch releases are supported on the newest minor line only.** Now that
`0.11.0` has shipped, fixes go to `0.11.x`, not `0.10.x`. To stay on a supported
version, follow the newest minor.

A patch release (`0.11.0` to `0.11.1`) contains bug fixes and security fixes
only. It never adds a database migration and never changes the API, so it is
always a straight image bump with no action on your side. Anything that needs a
schema or API change ships as a minor release and appears below if it requires
action.

**Everything below needs action when you upgrade**, either before the new image
will start or immediately after. Entries are newest first: if you are skipping
several releases, work upwards from the version you are on and apply every one
in between.

## Breaking changes

### Migrations renumbered, only affects `main`-built images (v0.11.0)

Upgrading from **v0.10.0 or any earlier published release needs no action**:
the new `013_consolidated` migration applies automatically on boot, exactly
like any other release.

It squashes four migrations that were merged after v0.10.0 but never shipped in
a release (`013_resource_freshness`,
`014_memories_updated_at_ignores_last_accessed`,
`015_seed_freshness_evaluate_schedules`, `016_team_project_search`) into one
step numbered `013`. Because golang-migrate keys on the numeric prefix alone,
renumbering is only safe for instances that never applied the old numbers, and
no released image ever did.

If you ran an image built from `main` between v0.10.0 and v0.11.0, your
`schema_migrations` table holds rows from the **old** numbering, so
`013_consolidated` will not re-run and your schema will not be reconciled by
the upgrade. Either recreate the database (the simplest, supported option) or,
after verifying the schema already matches, reconcile `schema_migrations` by
hand.

### Deprecated MCP tools `vibexp_io_list_teams` and `vibexp_io_list_projects` (v0.11.0)

Both are superseded by **`vibexp_io_list_teams_and_projects`**, which returns a
smaller payload and can find a project across all your teams without knowing
which team holds it. The two old tools still work in v0.11.0 but are
**removed in the next release**, so update any prompt, skill, or agent
configuration that names them now, while both are still registered.

→ [MCP Server](/user-guide/mcp-server/)

### Bundled Postgres upgraded from 16 to 17 (v0.10.0)

The Postgres image shipped in the combined-image `docker-compose.yml` moved from
`pgvector/pgvector:pg16` to `pgvector/pgvector:pg17`. Postgres data files are
**not compatible across major versions**, so a Postgres 17 image started on a
data directory created by Postgres 16 refuses to start. If you run the bundled
Postgres with a populated data volume, you must dump-and-restore (or
`pg_upgrade`) the volume once before pulling the new image. Managed / external
Postgres is unaffected: the pin only governs the bundled container.

→ [Upgrading Postgres to 17](/user-guide/self-hosting/postgres-pg17-migration/)

### Cookie consent removed, GTM now loads on the container ID alone (v0.10.0)

`VITE_GTM_ENABLED` no longer exists. Google Tag Manager loads whenever
`VITE_GTM_ID` is set, with no separate on/off flag. **If you had a GTM ID set
but the flag off, GTM will now load.** Unset `VITE_GTM_ID` before you upgrade if
you do not want that.

Remove `VITE_GTM_ENABLED` from your environment. The backend ignores it, so
leaving it in place is harmless but misleading.

The cookie-consent banner is gone too, along with the Consent Mode v2 bootstrap
and the login-time auto-grant. A self-hosted deployment should not inherit the
maintainer's compliance model, so consent is now yours to configure inside your
own tag container. Consent decisions stored in browsers are evicted on next
load, not migrated.

### GitHub App configuration moved to per-team settings (v0.9.0)

GitHub App credentials used to be instance-wide: one App in `config.yaml`,
shared by every team. They are now registered **per team** and stored encrypted
in the database. You must delete the top-level `github:` section from your
`config.yaml` or the backend refuses to start, drop the `GITHUB_APP_*` /
`GITHUB_WEBHOOK_*` environment variables, and re-register the App on each team
that uses the integration.

This does **not** affect `auth.github`, the GitHub web-login OAuth client.

→ [Migrating to per-team GitHub Apps](/user-guide/self-hosting/github-app-migration/)
