---
title: Database & Migrations
description: PostgreSQL, pgvector, and the golang-migrate workflow in the VibeXP backend.
---

The backend stores all data in **PostgreSQL** with the
[pgvector](https://github.com/pgvector/pgvector) extension for semantic search.
The local dev stack (started by `make backend-run-dev`) runs a `pg15` container
with pgvector enabled, plus Mailpit and a local TEI embedding service (see
[Getting Started](/developer-guide/getting-started/)).

## Connection

Connection details come from the `database.*` keys in `config.yaml` (see
[Configuration](/developer-guide/backend/configuration/#database)). The pool and
migration runner live in `internal/database`. Data access is implemented in
`internal/repositories/postgres` using the
[squirrel](https://github.com/Masterminds/squirrel) SQL builder — this is the
only layer that issues SQL.

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
status, the OAuth Authorization Server tables). Three release migrations have
shipped since: `003` (per-team embedding providers, v0.4.0), `004` (provider
concurrency + model providers, v0.5.0), and `005` (search and embedding
enhancements, v0.6.0). A pre-existing pre-v0.3.0 database must be stamped to
the matching version so the consolidated files are never re-run against a
populated schema.
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

## Validating migrations

The CI and pre-commit hooks check that migrations are well-formed. Run the same
check locally:

```bash
make backend-check-migrations
```

This detects duplicate migration numbers (two files claiming the same `NNN`),
which would otherwise cause non-deterministic ordering.

## Adding a migration

1. Pick the next sequence number (one higher than the current maximum; with
   `005` as the newest shipped migration, the next one is `006`).
2. Create both files:

   ```bash
   touch backend/migrations/006_add_widgets_table.up.sql
   touch backend/migrations/006_add_widgets_table.down.sql
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
