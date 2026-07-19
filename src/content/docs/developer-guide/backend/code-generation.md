---
title: Code Generation
description: The generators behind the VibeXP backend, including oapi-codegen, Wire, mockery, the config schema generator, and the embedded OpenAPI bundle.
---

The backend relies on five code generators. All of their output is **committed**
to the repository, and CI fails if any of it is stale relative to its source.

:::danger[The golden rule]
**Never hand-edit generated files.** Always regenerate them via `make`, and keep
the Go output `gofmt -s` clean (CI enforces this). Generated files include
`*_gen.go`, `mock_*.go`, `internal/container/wire_gen.go`, and
`config.schema.json`.
:::

## oapi-codegen (server + types)

The OpenAPI spec drives [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen),
which generates the chi strict-server bindings and shared types from the bundled
spec (`dist/openapi.bundled.yaml`). The generators are configured by
`backend/oapi-codegen.yaml` (server) and `backend/oapi-codegen-types.yaml`
(types).

```bash
make backend-generate-openapi-server
```

This target first bundles the spec, then generates the strict-server code and the
types package. See [API & OpenAPI](/developer-guide/backend/api-and-openapi/) for
the spec-first workflow.

:::note[External clients are generated elsewhere]
This page covers the **in-repo** generators. The external typed clients
(`@vibexp/api-client` and `api-client-go`) are generated from the same spec but
live in their own repos, and are **auto-published** on merge to `main`. See
[API & OpenAPI](/developer-guide/backend/api-and-openapi/#the-api-change-flow)
for that flow.
:::

## Wire (dependency injection)

The dependency graph is wired with [Wire](https://github.com/google/wire). The
generated `internal/container/wire_gen.go` is committed, and Wire is pinned via
the `go.mod` `tool` directive so runs are reproducible in CI.

```bash
make backend-wire-gen     # regenerate internal/container/wire_gen.go
make backend-wire-check   # regenerate, then fail if it differs from the committed file
```

`backend-wire-check` catches DI drift — a hand-edited `wire_gen.go`, or a changed
provider signature that was never regenerated. It is idempotent on a clean tree.

## mockery (test mocks)

Service interfaces are mocked with [mockery](https://github.com/vektra/mockery) so
handlers and services can be unit-tested against fakes.

```bash
make backend-mock-generate   # regenerate all mocks (mockery --all)
```

The generated `mock_*.go` files are committed. See
[Testing](/developer-guide/backend/testing/) for how the mocks are used.

## Config schema (gen-config-schema)

The nested `config.Config` struct drives a JSON-schema generator
(`backend/cmd/gen-config-schema`) that produces the committed
`backend/config.schema.json`. The schema gives editors (VS Code / JetBrains via
the YAML language server) validation and autocomplete for `config.yaml` and
`config.example.yaml` — see
[Configuration](/developer-guide/backend/configuration/#the-json-schema).

```bash
make backend-generate-config-schema   # regenerate backend/config.schema.json
make backend-config-schema-check      # regenerate, then fail if it differs from the committed file
```

`backend-config-schema-check` runs in CI and catches a changed `Config` struct
that was never regenerated. It is idempotent on a clean tree.

## Embedded OpenAPI bundle

Every running instance serves its spec at `/openapi.yaml` and `/openapi.json`.
The served bytes are a committed, `go:embed`-ed bundle in
`internal/server/openapispec/`, regenerated with Redocly:

```bash
make backend-generate-openapi-bundle   # regenerate the embedded bundle
make backend-openapi-bundle-check      # regenerate, then fail if it differs from the committed files
```

CI and pre-commit run the drift check. Regenerate the bundle in the same
change as any spec edit.

## Quick reference

| Generator | Command | Output (committed) |
| --- | --- | --- |
| oapi-codegen | `make backend-generate-openapi-server` | strict-server handlers + `internal/server/gen/types` |
| Wire | `make backend-wire-gen` (`backend-wire-check` to verify) | `internal/container/wire_gen.go` |
| mockery | `make backend-mock-generate` | `mock_*.go` files |
| gen-config-schema | `make backend-generate-config-schema` (`backend-config-schema-check` to verify) | `backend/config.schema.json` |
| OpenAPI bundle | `make backend-generate-openapi-bundle` (`backend-openapi-bundle-check` to verify) | `internal/server/openapispec/openapi.bundled.{yaml,json}` |

:::tip
After changing the spec, a provider signature, a service interface, or the
`Config` struct, regenerate the relevant output and commit it in the same
change. Then run
`make backend-check` to confirm lint, vulncheck, and security all pass.
:::
