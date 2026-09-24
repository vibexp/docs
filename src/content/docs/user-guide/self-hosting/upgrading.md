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
image: ghcr.io/vibexp/vibexp:0.14.0
```

**Patch releases are supported on the newest minor line only.** Now that
`0.14.0` has shipped, fixes go to `0.14.x`, not `0.13.x`. To stay on a supported
version, follow the newest minor.

A patch release (`0.14.0` to `0.14.1`) contains bug fixes and security fixes
only. It never adds a database migration and never changes the API, so it is
always a straight image bump with no action on your side. Anything that needs a
schema or API change ships as a minor release and appears below if it requires
action.

**Everything below needs action when you upgrade**, either before the new image
will start or immediately after. Entries are newest first: if you are skipping
several releases, work upwards from the version you are on and apply every one
in between.

:::note[v0.14.0: migrations apply on boot, AI Summary is on by default]
v0.14.0 adds two migrations, `017_team_ai_summary_settings` (the per-team AI
Summary settings table) and `018_prompt_references_team_scope` (a data-only,
idempotent rebuild of the stored prompt reference graph). Both apply
**automatically on boot**. The new `ai_summary` config block defaults to
**enabled**, but a summary only runs for a team that has configured a
[model provider](/user-guide/integrations/ai-providers/#model-providers), and
each summary is one completion request billed to that provider.
`AI_SUMMARY_ENABLED=false` switches it off for every team that has not saved
its own AI Summary settings, which on upgrade is every team; a team admin can
still turn it back on for their team. The other env knobs are
`AI_SUMMARY_TOP_N`, `AI_SUMMARY_REQUEST_TIMEOUT`, and `AI_SUMMARY_STYLE`, all
validated at startup: an `AI_SUMMARY_TOP_N` above 10 or an unknown
`AI_SUMMARY_STYLE` stops the boot. The context budgets, `max_top_n`, and
`max_output_tokens_ceiling` (default 4096, the most output a team may ask for)
are file-only: mount your own `config.yaml` to change them. See
[Search → AI Summary](/user-guide/search/#ai-summary).
:::

:::note[v0.13.0 and v0.12.0 need no action]
v0.13.0 adds one migration, `016_consolidated` (a `labels` array on artifacts,
blueprints, and memories, plus an optional `title` on memories). v0.12.0 added
two, `014_embedding_jobs` (the durable embedding job queue) and
`015_team_settings_audit` (the settings-copy audit log). All three apply
**automatically on boot** like any other release: pull the image and restart.
v0.12.0's new knobs are optional and default sensibly, `EMBEDDING_QUEUE_*` for
queue drain tuning and `S3_PATH_STYLE`, which finally lets MinIO deployments
drop their mounted `config.yaml`. Upgrading from any published release,
including straight from v0.10.0, needs no manual `schema_migrations` step:
golang-migrate walks the whole chain of files on boot regardless of how many
releases you skip. Manual reconciliation is only ever a concern for an
instance that tracked an unreleased `main` build between releases (see the
migration-renumbering entries below).
:::

## Breaking changes

### Prompt `@references` resolve only within the prompt's team (v0.14.0)

A prompt's `@slug` references used to be looked up among the **reader's**
prompts in any team. The same prompt could therefore render differently for
different teammates, and could inline content from a team the prompt does not
belong to. References now resolve among the prompts of the team that owns the
prompt, on every path: the REST render endpoint, the MCP
`vibexp_io_render_prompt` tool, shared prompts, and the stored reference graph.

A prompt that relied on a same-slug prompt in **another** team now shows
`Reference not found` where that content used to be. That is intended: the old
behavior was a cross-team leak. Copy the referenced prompt into the prompt's
own team if you still need it. Migration `018_prompt_references_team_scope`
corrects the stored reference graph on boot, which also restores delete
protection for a prompt a teammate's prompt references.

→ [Advanced prompt features](/user-guide/prompts/advanced-features/)

### Prompt variable values are inserted as literal text (v0.14.0)

A value supplied for a `{{variable}}` at render time is now inserted exactly as
given. It is no longer scanned for `@references` or substituted a second time,
so a value such as `git@github.com` or `@some-slug` comes through unchanged. A
reference assembled from a variable, such as `@{{which}}`, no longer resolves.
If a prompt picked its reference through a variable, reference the prompts
directly instead.

→ [Advanced prompt features](/user-guide/prompts/advanced-features/)

### Out-of-range pagination returns `400` (v0.14.0)

A `page` or `limit` outside its range used to fall back silently to the default,
so `limit=200` quietly returned a 10-item page. It is now rejected with `400`
and a message naming the allowed range. This covers `page`/`limit` on the
prompt, artifact, blueprint, memory, agent, feed, feed item, and feed reply list
endpoints, `per_page` on REST search, and `limit` on the MCP `vibexp_io_search`
tool. The ranges are `limit` 1 to 100 and `page` 1 to 10000, and a non-numeric
value is rejected too. Omitting a parameter still gives the default (`page` 1;
`limit` 10, or 20 on the feed endpoints). Check any script or integration that
asks for more than 100 items per page. The other MCP list tools keep capping
`limit` without an error.

### Prompt label filter now matches ANY label, not ALL (v0.13.0)

`GET /api/v1/{team_id}/prompts?labels=a,b` used to match only prompts
carrying **every** listed label. It now matches a prompt carrying **any** of
them (OR), the same semantics artifacts, blueprints, and memories already
used for their own `labels` filter. Prompts were the one resource where the
same parameter name meant something different. Two related changes ship in
the same release: a request naming more than 25 labels, or a label longer
than 50 characters, now gets `400` instead of reaching Postgres; and
`?labels=a,,b` or a trailing comma now filters on the non-empty entries
instead of matching nothing.

If an integration relied on the old AND behavior, filter client-side by
intersecting results across single-label requests instead.

→ [Prompts API Integration](/user-guide/prompts/api-integration/)

### Migrations renumbered again, only affects `main`-built images (v0.13.0)

Upgrading from **v0.12.0 or any earlier published release needs no action**:
the new `016_consolidated` migration applies automatically on boot, exactly
like any other release.

It squashes two migrations that were merged after v0.12.0 but never shipped
in a release (`016_resource_labels`, `017_memory_title`) into one step
numbered `016`. As with the earlier `013_consolidated` squash below, no
released image ever applied the old numbers, so renumbering is safe for
everyone upgrading between releases. Only an instance that tracked a `main`
build between v0.12.0 and v0.13.0 needs to recreate its database or reconcile
`schema_migrations` by hand.

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
which team holds it. The two old tools still work in v0.14.0 (the code
originally planned to remove them "in one release," but that has slipped
three times with no new date set). Update any prompt, skill, or agent
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
