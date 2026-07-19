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
| `agents` | `ai-tools` |
| `api-keys` | `artifacts` |
| `attachments` | `auth` |
| `backoffice` | `blueprints` |
| `comments` | `embedding-providers` |
| `feeds` | `github` |
| `health` | `invitations` |
| `memories` | `model-providers` |
| `notifications` | `projects` |
| `prompts` | `search` |
| `subscriptions` | `support` |
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
