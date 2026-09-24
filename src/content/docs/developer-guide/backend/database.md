---
title: Database & Migrations
description: PostgreSQL, pgvector, and the golang-migrate workflow in the VibeXP backend.
---

The backend stores all data in **PostgreSQL** with the
[pgvector](https://github.com/pgvector/pgvector) extension for semantic search.
The local dev stack (started by `make backend-run-dev`) runs a `pg17` container
with pgvector enabled, plus Mailpit and a local TEI embedding service (see
[Getting Started](/developer-guide/getting-started/)).

## Connection

Connection details come from the `database.*` keys in `config.yaml` (see
[Configuration](/developer-guide/backend/configuration/#database)). The pool and
migration runner live in `internal/database`. Data access is implemented in
`internal/repositories/postgres` using the
[squirrel](https://github.com/Masterminds/squirrel) SQL builder — this is the
only layer that issues SQL.

Postgres TLS is controlled by `database.sslmode`. Only two values are
supported: `disable` (the default, no TLS) and `require` (encrypt without
server-certificate verification). `verify-ca` / `verify-full` are not supported
yet. Managed Postgres offerings that require TLS work with `require`.

## Migrations run automatically on boot

Migrations use [golang-migrate](https://github.com/golang-migrate/migrate) and
**run automatically when the backend starts**. There is no separate migrate
command to run in normal operation: bring up a fresh database, start the backend,
and the schema is created and brought up to date.

Migration files live in `backend/migrations/`.

:::note[Migration history]
The early history was squashed: `001_baseline` is a `pg_dump`-style baseline
replacing the original incremental migrations, and `002_consolidated` squashes
everything that accumulated after the backend-v0.2.0 release (memory lifecycle
status, the OAuth Authorization Server tables). Release migrations shipped
since: `003` (per-team embedding providers, v0.4.0), `004` (provider
concurrency + model providers, v0.5.0), `005` (search and embedding
enhancements, v0.6.0), `006_consolidated` (RBAC foundation + resource
comments, v0.7.0), `007` (blueprint sync, v0.8.0), `008` (attachment relative
paths, v0.8.0), `009` (blueprint source content SHA, v0.8.0), `010` (typed
resource relations, v0.8.0), and `011_consolidated` (v0.9.0, squashing the
post-v0.8.0 increments: user status, per-team search settings, per-team
GitHub App configs, per-team email providers, and the removal of AI-tool
hook ingestion, billing/subscriptions, and Firebase web push), `012`
(schedules, v0.10.0), and `013_consolidated` (v0.11.0, squashing the
post-v0.10.0 increments: the resource-freshness schema (four tables plus
per-medium `last_accessed_*` columns on the four resource tables), the
narrowed `update_memories_updated_at` trigger, and the teams/projects
keyword-search indexes), `014_embedding_jobs` (the durable embedding job
queue, v0.12.0), `015_team_settings_audit` (the append-only settings-copy
audit log, v0.12.0), and `016_consolidated` (v0.13.0, squashing the two
migrations that accumulated after v0.12.0 but never shipped in a release: a
`labels text[]` column plus a GIN index on `artifacts`, `blueprints`, and
`memories`, and an optional `title` column on `memories`),
`017_team_ai_summary_settings` (per-team AI Summary settings, v0.14.0), and
`018_prompt_references_team_scope` (a data-only correction of the prompt
reference graph, v0.14.0). A pre-existing
pre-v0.3.0 database must be stamped to the matching version so the
consolidated files are never re-run against a populated schema.
:::

## File naming

Each migration is a numbered pair of `.up.sql` / `.down.sql` files:

```text
NNN_descriptive_name.up.sql     # forward migration
NNN_descriptive_name.down.sql   # rollback
```

The current set (`.up.sql` shown; each has a matching `.down.sql`):

```text
001_baseline.up.sql
002_consolidated.up.sql
003_per_team_embedding_providers.up.sql
004_provider_concurrency_and_model_providers.up.sql
005_search_and_embedding_enhancements.up.sql
006_consolidated.up.sql
007_blueprint_sync.up.sql
008_attachment_relative_path.up.sql
009_blueprint_source_content_sha.up.sql
010_resource_relations.up.sql
011_consolidated.up.sql
012_schedules.up.sql
013_consolidated.up.sql
014_embedding_jobs.up.sql
015_team_settings_audit.up.sql
016_consolidated.up.sql
```

`NNN` is a zero-padded, strictly increasing sequence number. Every `.up.sql` must
have a matching `.down.sql`.

## pgvector & embeddings

Embeddings are stored in pgvector columns. The vector width is **fixed at 1024**
in code and locked to the column definition — it is not configurable. The
`001_baseline.up.sql` migration enables the extension and creates the table:

```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE public.embeddings (
    -- ...
    vector_embeddings public.vector(1024) NOT NULL,
    -- ...
);
```

See [Configuration → Embeddings](/developer-guide/backend/configuration/#embeddings)
for how the embedding pipeline and provider work.

## Keyword search and pg_trgm

Keyword (full-text) search is the fallback when a team has no embedding
provider. Since v0.6.0 (`005_search_and_embedding_enhancements`), it runs
three passes:

1. Strict `websearch_to_tsquery` (AND semantics)
2. Relaxed OR-semantics rewrite when the strict pass returns nothing
3. A `pg_trgm` typo-tolerance pass against titles (word similarity, GIN
   `gin_trgm_ops` indexes on prompt, artifact, blueprint, and memory titles)

Migration `005` enables the `pg_trgm` extension and creates the trigram
indexes. It also adds per-provider `query_prefix` / `document_prefix` columns
to `embedding_providers` for asymmetric embedding models.

Since v0.11.0 the same three-pass ladder also covers **teams and projects**.
`013_consolidated` adds four indexes for it:

| Index | Kind | Covers |
| --- | --- | --- |
| `idx_teams_fts` | GIN full-text | team name + description |
| `idx_projects_fts` | GIN full-text | project name + description |
| `idx_teams_name_trgm` | GIN `gin_trgm_ops` | team name only |
| `idx_projects_name_trgm` | GIN `gin_trgm_ops` | project name only |

It creates no extension: `pg_trgm` was already installed by `005`, so
self-hosters on managed Postgres need no new action.

:::caution
The index expressions must stay **byte-identical** to the expressions
`internal/repositories/postgres/entity_search.go` emits (`ftsMatchExpr` /
`trgmNameExpr`), or the planner silently ignores them and every pass falls back
to a sequential scan. Column qualification is the one permitted difference
(`t.name` in the query vs `name` in the index).
:::

## Resource freshness (v0.11.0)

`013_consolidated` creates the schema behind
[Resource Freshness](/user-guide/resource-freshness/):

| Table | Holds |
| --- | --- |
| `resource_freshness` | System-owned state. A row exists only **while** a resource is stale; clearing it deletes the row. |
| `freshness_rules` | The team's staleness policy (resource types, mediums, threshold in days, optional project scope). |
| `team_freshness_settings` | One row per team (evaluation interval, reversibility). No row means "inherit the defaults", so `DELETE` is the reset path. |
| `resource_freshness_audit` | Append-only mark/clear log. |

It also denormalizes four per-medium columns,
`last_accessed_web_at` / `last_accessed_cli_at` / `last_accessed_mcp_at` /
`last_accessed_api_at`, onto `prompts`, `artifacts`, `blueprints` and
`memories`, so rule evaluation is an indexed column compare instead of an
aggregate over `resource_access_events`. The columns are nullable with no
default, which keeps each `ALTER` a catalog-only change on four hot tables.

Three design points worth knowing before you extend this schema:

- **No backfill, on purpose.** `resource_access_events` is pruned on
  `retention.access_event_days` (default 90), so seeding the new columns from
  it would produce a partial, silently wrong history. Everything starts NULL
  and rules stay quiet until post-deploy access data accrues.
- **`resource_freshness.resource_id` is polymorphic with no foreign key.** One
  column cannot reference four tables, so cleanup is application level (the
  same pattern as comments and relations).
- **The enum-ish text columns carry no `CHECK` constraints.** The valid sets
  for `status`, `action`, `reason`, `resource_types` and `mediums` are owned by
  the service layer, so extending one never needs a migration.

## Embedding job queue (v0.12.0)

`014_embedding_jobs` creates `embedding_jobs`, the system of record for
outstanding embedding work. The dispatcher inserts a row the moment an
embeddable event arrives, before any I/O that could be lost; workers **lease**
rows out of it, and a terminal outcome acks the row.

| Column group | Holds |
| --- | --- |
| `entity_type` / `entity_id` / `user_id` | Which entity the job embeds. `entity_id` is polymorphic across five entity tables, so it carries **no foreign key** (the same constraint `resource_freshness` lives with). |
| `payload` (jsonb) | The normalized title/description/body from the originating event: a domain event cannot be rebuilt from an entity id alone. |
| `state` (`pending`/`claimed`/`done`/`failed`), `attempts` | `attempts` is incremented at **claim** time, not at failure, so a worker that dies mid-flight still converges on `embedding.queue.max_attempts`. |
| `available_at`, `claimed_by`, `claimed_at`, `lease_expires_at`, `last_error` | Lease bookkeeping. An expired lease, which is what a dead process leaves behind, simply becomes claimable again, so restart recovery needs no boot-time sweep: the ordinary claim query **is** the recovery path. |

Two indexes carry the design:

| Index | Kind | Purpose |
| --- | --- | --- |
| `idx_embedding_jobs_outstanding_entity` | Partial UNIQUE on `(entity_type, entity_id)` where `state IN ('pending','claimed')` | One outstanding job per entity: a re-enqueue coalesces onto the existing row, refreshing the payload so the newest content wins. Terminal rows are excluded so an entity can be embedded again later. |
| `idx_embedding_jobs_claimable` | Partial B-tree on `(created_at, id)` where `state IN ('pending','claimed')` | Keyed on the claim query's `ORDER BY`, so the query walks the index and stops at its `LIMIT` instead of sorting the claimable set on every poll. |

There is deliberately **no `team_id` column**: the team is resolved per job from
the entity and is not known at enqueue time. Drain behavior is tuned by
[`embedding.queue.*`](/developer-guide/backend/configuration/#embedding-job-queue-embeddingqueue).

## Team settings audit (v0.12.0)

`015_team_settings_audit` creates `team_settings_audit`, an **append-only** log
of cross-team settings copies (see
[Copying settings between teams](/user-guide/copying-team-settings/)). `team_id`
is the **destination** team, the one whose owners the log is written for, and
cascades with it; `actor_user_id` is `ON DELETE SET NULL` so an entry outlives
the account. `source_team_id` deliberately carries no foreign key, so an entry
survives the source team being deleted. The repository exposes no update and no
delete, and nothing expires rows.

## Resource labels and memory title (v0.13.0)

`016_consolidated` adds a `labels text[] NOT NULL DEFAULT '{}'` column plus a
GIN index (`idx_artifacts_labels` and equivalents) to `artifacts`,
`blueprints`, and `memories`. Prompts already had `labels`, nullable rather
than `NOT NULL`. The same migration adds a nullable `title varchar(255)`
column to `memories`, with no default and no backfill: every memory that
predates v0.13.0 keeps `title: null`.

The up-migration also backfills: any existing `metadata->'tags'` JSON array on
a memory is folded into the new `labels` column (trimmed, deduped, capped at
10 entries/50 characters, matching the service-layer normalization every
write goes through) and the `tags` key is removed from `metadata`, guarded by
`jsonb_typeof(metadata->'tags') = 'array'` so a non-array value at that key is
left untouched. The down-migration reverses this, and (fixing issue #940)
writes `metadata.tags` back from `labels` only when the `tags` key is absent
or already an array on the row being reversed, never clobbering a
non-array value a client may have written after the up-migration ran.

Label limits (10 per resource, 50 characters each) are enforced in
`internal/services/labels.go` for artifacts, blueprints, and memories, funnelling
both the REST handlers and the MCP tools through one `validateLabels` call.
**Prompts are the exception**: nothing calls the equivalent validator on the
prompt write path, so the same limits are documented and UI-enforced but not
server-enforced for prompts as of v0.14.0.

The `labels` **filter** query parameter (`GET .../artifacts?labels=a,b`, and
the equivalent on blueprints, memories, and prompts) is a separate limit,
`MaxLabelsFilterValues = 25` in `internal/server/handlers_memories.go`,
deliberately higher than the 10-per-resource write cap since a filter unions
labels across many resources. See
[Metadata filtering](/user-guide/metadata-filtering/) for the parallel
`metadata` filter, and the Labels sections on
[Artifacts](/user-guide/artifacts/#labels),
[Blueprints](/user-guide/blueprints/#labels), and
[Memory](/user-guide/memory/#labels) for the user-facing behavior.

## AI Summary settings and prompt reference scope (v0.14.0)

`017_team_ai_summary_settings` creates `team_ai_summary_settings`, one row per
team (`team_id` is the primary key and cascades with the team). It stores a
team's override of the instance `ai_summary:` defaults as a **whole row**, the
same contract as `team_search_settings`: no row means the team inherits every
default, a row means the team owns every value. The columns are `enabled`,
`model_provider_id`, `top_n` (`CHECK 1..10`), `style` (`CHECK` in `concise`,
`balanced`, `detailed`), and `max_output_tokens` (`CHECK > 0`), plus the usual
timestamps and `version`. `model_provider_id` is the only nullable column:
`NULL` means "use the team's default provider", and the foreign key is
`ON DELETE SET NULL`, so deleting a provider falls the team back to its default
instead of deleting the profile. The context budgets, the request timeout, and
the `max_top_n` / `max_output_tokens_ceiling` caps are deliberately absent:
they stay instance-only config (see
[Backend configuration](/developer-guide/backend/configuration/)).

`018_prompt_references_team_scope` changes no schema. It rebuilds
`prompt_references` to match the v0.14.0 rule that a prompt's `@slug`
references resolve within the prompt's own team. It deletes edges that cross
teams and self-edges, then re-derives every edge from the prompt bodies
(`@@` is an escaped literal `@`, never a reference), which restores the
missing edges to a teammate's prompt and with them the delete protection for
referenced prompts. It is idempotent: a second run deletes nothing and the
insert is `ON CONFLICT DO NOTHING`.

## Validating migrations

The CI and pre-commit hooks check that migrations are well-formed. Run the same
check locally:

```bash
make backend-check-migrations
```

This detects duplicate migration numbers (two files claiming the same `NNN`),
which would otherwise cause non-deterministic ordering. CI additionally runs
the check as a PR-only `migrations` job in merge mode against the branch the PR
targets (`main` normally, the `release/X.Y.x` line for a backport), which
catches two parallel PRs claiming the same number, the collision local
runs cannot see. That job is path-filtered: a `dorny/paths-filter` gate in the
`changes` job runs it only on pull requests that touch `backend/migrations/`.
The `migration-renumbering` PR label is the escape hatch for deliberate
renumberings such as post-release consolidations.

## Adding a migration

1. Pick the next sequence number (one higher than the current maximum; with
   `016_consolidated` as the newest shipped migration, the next one is
   `017`).
2. Create both files:

   ```bash
   touch backend/migrations/017_add_widgets_table.up.sql
   touch backend/migrations/017_add_widgets_table.down.sql
   ```

3. Write the forward schema change in `.up.sql` and the exact rollback in
   `.down.sql`.
4. If you added or changed columns the API exposes, update the OpenAPI spec and
   regenerate — see [API & OpenAPI](/developer-guide/backend/api-and-openapi/)
   and [Code Generation](/developer-guide/backend/code-generation/).
5. Run `make backend-check-migrations`, then start the backend so the migration
   applies, and run the [tests](/developer-guide/backend/testing/).

:::tip[Test against real Postgres]
Repository changes should be covered by integration tests, which run against a
live Postgres instance:

```bash
make backend-test-integration
```
:::

:::caution
Migrations are applied on boot and are effectively immutable once merged. Never
edit a migration that has shipped — add a new one instead.
:::
