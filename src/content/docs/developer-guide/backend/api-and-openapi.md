---
title: API & OpenAPI
description: The spec-first OpenAPI workflow, resource groups, bundling, validation, and the API-change flow.
---

The backend is **spec-first**: `backend/openapi.yaml` is the source of truth for
the REST API. The server handlers and the typed frontend client are generated
from it — you change the spec first, then regenerate code, never the other way
around.

## Multi-file spec layout

The spec is split across multiple files so it stays maintainable:

```text
backend/
  openapi.yaml      # root: info, servers, components, tags, and $ref index
  paths/<domain>.yaml     # operations, one file per tag/domain
  schemas/<domain>.yaml   # schemas, one file per domain
```

The convention is **one tag = one `paths/` file = one `schemas/` file**.

## Resource groups

The API is organised into these domains (one `paths/*.yaml` file each):

| Group | Group |
| --- | --- |
| `activities` | `admin` |
| `agents` | `api-keys` |
| `artifacts` | `attachments` |
| `auth` | `backoffice` |
| `blueprints` | `comments` |
| `embedding-providers` | `feeds` |
| `freshness` | `github` |
| `github-app-config` | `health` |
| `invitations` | `memories` |
| `metadata` | `model-providers` |
| `notifications` | `projects` |
| `prompts` | `relations` |
| `search` | `support` |
| `team-email-provider` | `team-settings` |
| `teams` | `types` |
| `user` | `webhooks` |

Shared schema definitions live in `schemas/common.yaml`; other `schemas/*.yaml`
files mirror the path domains.

### Instance-admin API

The `admin` domain (`paths/admin.yaml`) is the instance-admin surface at
`/api/v1/admin/*`: `getAdminStats`, `listAdminUsers`, `getAdminUser`,
`listAdminTeams`, and `getAdminTeam`. It is **instance-admin-only**. The routes
are mounted behind optional auth plus an instance-admin check, so non-admins and
unauthenticated callers alike get **404**. The surface is not advertised.

### Resource comments

The `comments` domain (`paths/comments.yaml`) is new in v0.7.0 and **REST-only**
(no MCP). It is team-scoped under `/api/v1/{team_id}/comments` and lets users
comment on resources.

### Typed resource relations

The `relations` domain (`paths/relations.yaml`) is team-scoped under
`/api/v1/{team_id}/relations` and records typed links between prompts,
blueprints, memories and artifacts. Unlike `comments`, it has both a REST and an
MCP surface: AI tools create links through the `vibexp_io_link_resources` tool
rather than through the endpoints.

Five operations: `listRelations` (a resource's relations), `createRelation`,
`confirmRelation` (promote an AI-suggested link to confirmed), `deleteRelation`,
and `seedRelations` (backfill suggestions from embedding similarity).

Resource reads carry the result: a `GET` on a prompt, blueprint, memory or
artifact gains `related` (typed links) and `similar` (embedding neighbours). See
[Relations](/user-guide/relations/) for the relation types, the type-constraint
matrix and the suggested-vs-confirmed trust tiers.

### Resource freshness

The `freshness` domain (`paths/freshness.yaml`) is new in v0.11.0 and
team-scoped: eight path items, twelve operations, covering rule CRUD
(`/{team_id}/freshness/rules`), per-team settings
(`/{team_id}/settings/freshness`), four analytics endpoints under
`/{team_id}/freshness/metrics/*` (over-time, by-type, by-project, by-rule) and
the audit log (`/{team_id}/freshness/audit`). See
[Resource Freshness](/user-guide/resource-freshness/) for what the rules mean.

## Bundling

The multi-file source is bundled into a single artifact with
[Redocly](https://redocly.com/) before linting, docs, and code generation:

```bash
make backend-bundle-openapi
# → backend/dist/openapi.bundled.yaml
```

Always consume the **bundle** (`dist/openapi.bundled.yaml`), not the source tree.

## Served at runtime

Since v0.5.0 every running instance serves its own bundled spec at
`GET /openapi.yaml` and `GET /openapi.json`. The bytes come from a committed,
`go:embed`-ed bundle in `internal/server/openapispec/`:

```bash
make backend-generate-openapi-bundle   # regenerate the embedded bundle (redocly)
make backend-openapi-bundle-check      # regenerate, then fail on drift
```

CI and pre-commit run the drift check, so regenerate and commit the embedded
bundle whenever the spec changes.

## Validation & linting

```bash
make backend-validate-openapi   # structural validation (swagger-cli)
make backend-lint-openapi       # ruleset linting (vacuum, Spectral-format ruleset)
```

CI runs both, so run them locally before committing.

## Code generation

The bundle drives [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen),
which produces the strict-server bindings and shared types. The generated code is
**committed** and must never be hand-edited:

```bash
make backend-generate-openapi-server
```

See [Code Generation](/developer-guide/backend/code-generation/) for the full set
of generators (oapi-codegen, Wire, mockery) and the golden rules around them.

## Response conformance

Being spec-first for routing and request types does not by itself make response
*bodies* match the spec: a hand-marshaled response can drift silently. Three
gates in `internal/server` close that gap, and all of them run under
`make backend-test` and the CI `unit` job.

| Gate | File | What it enforces |
| --- | --- | --- |
| Route drift | `openapi_drift_test.go` | Every mounted route is documented, and every documented path is mounted. |
| Payload-coverage ledger | `openapi_payload_coverage_test.go` | Every documented operation either has a spec-validated response assertion or an explicit ledger entry. |
| Required arrays never null | `required_array_null_test.go` | A spec-**required** array response field can never serialize as `null` (issue #125). |

A handler test opts into validation by calling
`specconformance.AssertConformsToSpec` on the recorded response. That validates
the payload against `openapi.yaml` (via
[pb33f/libopenapi-validator](https://github.com/pb33f/libopenapi-validator))
**and** records the operation as covered, which is what feeds the ledger.

The ledger is **shrink-only**: you delete entries as you convert a domain, you
never add one. It is enforced in `TestMain`, after the full package suite has
run, and it is skipped on partial runs (`-run`, `-skip`, `-list`, `-short`), so
a green `go test -run TestSomething` proves nothing about it. New operations
must ship spec-validated from day one.

For required array fields, use `models.JSONArray[T]`
(`internal/models/jsonarray.go`): a nil value marshals to `[]` by construction,
so the invariant holds regardless of test coverage. It is assignable to and
from a plain `[]T`, so only the struct field declaration changes. Do **not**
use it for arrays the spec marks nullable (`x | null`, for example
`Prompt.labels`); those keep a plain `[]T` so a nil value can still serialize
as `null`.

The wider conformance epic is closed progressively, domain by domain: whenever
you touch a documented domain, leave it more conformant than you found it.

### Domain status

As of v0.11.0 these domains are served by spec-generated strict-server types:
notifications, types, team roles, comments, relations, team settings,
freshness, metadata, admin and embedding providers are fully converted, and the
**READ** endpoints of prompts, blueprints, artifacts and memories joined them.

Each read slice is its own generated package under
`internal/server/gen/<domain>/`, and its operations are selected by explicit
`include-operation-ids` rather than `include-tags`. The reason is recorded in
`backend/oapi-codegen-prompts.yaml`: `include-tags: [Prompts]` is oapi-codegen's
generation unit, so it would drag all twelve Prompts-tagged operations into one
`StrictServerInterface` and force the whole domain to convert in a single
change. Selecting ids lets a conversion land one slice at a time.

The write paths (create, update, delete) plus prompt share, render,
dependencies, versions and the prompt gallery are still hand written and still
carry ledger entries.

## The API-change flow

A change to the API ripples through the codebase in order:

1. **Update the spec.** Edit `backend/paths/*.yaml` / `backend/schemas/*.yaml`,
   then regenerate the server (`make backend-generate-openapi-server`) and
   implement the handler/service/repository logic. Validate and lint the spec.
2. **The typed clients publish automatically.** Merging a spec change to `main`
   triggers the `publish-api-client.yml` workflow (path-filtered to
   `backend/openapi.yaml`, `backend/paths/**`, and `backend/schemas/**`), which
   auto-publishes **both** generated clients from the spec:
   `@vibexp/api-client` (npm, source in
   [`api-client-js`](https://github.com/vibexp/api-client-js)) and
   `api-client-go` (Go module, source in
   [`api-client-go`](https://github.com/vibexp/api-client-go)). Each downstream
   repo computes its own next version and generates from `vibexp/vibexp@main`.
3. **Bump the frontend dependency.** Update the frontend to the new
   `@vibexp/api-client` version and use the new endpoints/types.

:::caution
The generated server code is checked into the repo. CI fails the PR if it is
stale relative to the spec — always regenerate and commit after spec changes.
:::
