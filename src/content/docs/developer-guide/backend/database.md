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
keyword-search indexes). A pre-existing
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
   `013_consolidated` as the newest shipped migration, the next one is `014`).
2. Create both files:

   ```bash
   touch backend/migrations/014_add_widgets_table.up.sql
   touch backend/migrations/014_add_widgets_table.down.sql
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
