---
title: Backend Overview
description: Architecture, request flow, and package layout of the VibeXP Go backend.
---

The VibeXP backend is a Go REST API in the [`vibexp/vibexp`](https://github.com/vibexp/vibexp)
monorepo. It lives under `backend/` and is the Go module
`github.com/vibexp/vibexp`. It serves the REST API consumed by the frontend and
CLI, an MCP server for AI agents, and a set of internal job endpoints.

This page gives you the big picture. For the `config.yaml` reference see
[Backend Configuration](/developer-guide/backend/configuration/); for the
spec-first workflow see [API & OpenAPI](/developer-guide/backend/api-and-openapi/).

## Key technologies

| Concern | Technology |
| --- | --- |
| Language / toolchain | Go `1.25.12` (pinned via `GOTOOLCHAIN`) |
| Entrypoint / CLI | [cobra](https://github.com/spf13/cobra) |
| HTTP router | [chi v5](https://github.com/go-chi/chi) |
| Database | PostgreSQL + [pgvector](https://github.com/pgvector/pgvector) |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) (auto-run on boot) |
| SQL building | [squirrel](https://github.com/Masterminds/squirrel) |
| Dependency injection | [Wire](https://github.com/google/wire) (committed `wire_gen.go`) |
| API codegen | [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) strict server |
| Mocks | [mockery](https://github.com/vektra/mockery) |
| Config | [koanf](https://github.com/knadh/koanf) — a required, env-interpolated `config.yaml` |
| Observability | [OpenTelemetry](https://opentelemetry.io/) |
| Auth | Identity-provider registry (Google / GitHub / generic OIDC) + embedded OAuth 2.1 Authorization Server ([ory/fosite](https://github.com/ory/fosite)) |

## Layered design

The backend is organised into clean, one-directional layers. Requests flow
inward; lower layers never import higher ones.

```text
cmd/                 cobra entrypoint, wires up and starts the server
  └─ internal/server      HTTP handlers + chi middleware
       └─ internal/services    business logic (interfaces + implementations)
            └─ internal/repositories/postgres   data access (squirrel)
                 └─ internal/database    connection pool, migrations
```

- **`cmd/`** — the cobra command (`root.go`) that builds the dependency graph and
  launches the HTTP server. `main.go` at the module root just calls into it.
- **`internal/server`** — chi router, middleware chain, and the OpenAPI
  strict-server handlers that translate HTTP into service calls.
- **`internal/services`** — business logic, exposed as interfaces so handlers and
  tests depend on abstractions (mockery generates the mocks).
- **`internal/repositories/postgres`** — data access built with squirrel; the
  only layer that talks SQL.
- **`internal/database`** — the connection pool and migration runner.

## The `internal/` package map

```text
internal/
  auth/            identity-provider registry (idp/), session cookies (session/),
                   embedded OAuth 2.1 AS (oauthserver/), JWT verification
                   (authkit/, mcptoken/)
  authz/           pure team RBAC permission matrix (owner/admin/member);
                   single source of truth consumed by services
  cache/           in-process / shared caching helpers
  config/          koanf-based config.yaml loading, interpolation, validation
  container/       Wire dependency-injection wiring (wire_gen.go committed)
  contextkeys/     typed request-context keys (auth subject, request id, …)
  database/        Postgres pool + golang-migrate runner
  errors/          RFC 9457 problem-details error model
  external/        outbound integrations (GitHub App, email providers)
  logging/         slog setup (json/text, levels)
  models/          domain models shared across layers
  observability/   OpenTelemetry tracing/metrics + environment detection
  repositories/    data access; postgres/ holds the SQL implementations
  server/          chi router, middleware, generated handlers
  services/        business logic interfaces + implementations
  specconformance/ tests that the running server matches the OpenAPI spec
  storage/         attachment storage (GCS)
  testutils/       shared test helpers
  utils/           small shared helpers
```

## Request flow

Every API request passes through the chi middleware chain before reaching a
handler. The chain (configured in `internal/server`) runs roughly in this order:

1. **RealIP** — resolves the client IP from proxy headers (used by rate limiting).
2. **Rate limiting** — per-IP limits per route group (`auth` and `api`), tuned
   via the `rate_limit.*` keys in `config.yaml`.
3. **CORS** — allows configured origins (`server.cors_allowed_origins`,
   localhost in dev).
4. **Authentication** — resolves the caller from a session cookie, bearer JWT, or
   API key and binds the subject to the request context.
5. **Activity logging** — records request/activity metadata.
6. **Handler** — the generated OpenAPI strict-server handler validates and
   decodes the request.
7. **Service** — business logic runs against repository interfaces.
8. **Repository** — squirrel-built SQL executes against Postgres.

Side effects that should not block the response — such as generating embeddings
and post-signup bootstrapping — are published to an **in-process async event
bus**. Worker goroutines drain the bus with bounded retries (see the
`event_bus.*` settings on the
[Configuration](/developer-guide/backend/configuration/#event-bus) page). The
embedding pipeline is one of these workers: there is no external AI service and
no message broker.

:::note
The MCP server (`/mcp/v1/common`) and the embedded OAuth 2.1 Authorization
Server (`/oauth2/*`) mount alongside the REST API in the same process. See
[MCP Server](/developer-guide/backend/mcp-server/) and
[Authentication](/developer-guide/backend/authentication/).
:::

The backend also **serves the frontend SPA**: combined release builds embed the
built frontend into the binary via the `embedfrontend` build tag
(`internal/server/spa_embed.go`), and the runtime `/config.js` endpoint serves
the deploy-time frontend values (`frontend.*` config keys) as
`window.__VIBEXP_ENV__` — so one image serves the API and the app from the same
origin. Default (non-embed) builds compile without a built frontend and still
serve `/config.js`.

## Where to go next

- [Backend Configuration](/developer-guide/backend/configuration/) — the full `config.yaml` reference.
- [Database & Migrations](/developer-guide/backend/database/) — Postgres, pgvector, migrations.
- [Authentication](/developer-guide/backend/authentication/) — provider registry, sessions, the embedded OAuth 2.1 AS.
- [API & OpenAPI](/developer-guide/backend/api-and-openapi/) — the spec-first flow.
- [Code Generation](/developer-guide/backend/code-generation/) — oapi-codegen, Wire, mockery.
- [Testing](/developer-guide/backend/testing/) — unit and integration tests.
