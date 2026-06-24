---
title: Testing
description: Unit tests, integration tests, coverage, and mocks for the VibeXP backend.
---

The backend has two layers of automated tests: fast unit tests that run
everywhere, and integration tests that exercise the repositories against a real
Postgres. Tests use [testify](https://github.com/stretchr/testify) for assertions
and [mockery](https://github.com/vektra/mockery)-generated mocks for service
interfaces.

## Unit tests

```bash
make backend-test
```

This runs `go test -race -v ./...` with a 60s timeout. The `-race` flag enables
the data-race detector, so concurrency bugs surface in CI. Unit tests use the
committed `mock_*.go` mocks rather than touching a database — see
[Code Generation](/developer-guide/backend/code-generation/#mockery-test-mocks)
for how to regenerate mocks when an interface changes.

## Integration tests

```bash
make backend-test-integration
```

Integration tests run the repository layer (`internal/repositories/postgres/...`)
against a **live Postgres** instance — locally via Docker Compose, in CI via a
service container. They are gated behind the `integration` build tag, so the
default `make backend-test` does not run them.

- Override the target database with the `POSTGRES_TEST_DSN` environment variable.
- The timeout is 180s to allow for migrations and real I/O.

:::tip
Start the local stack first (`make backend-run-dev` brings up Postgres), or point
`POSTGRES_TEST_DSN` at any reachable test database before running integration
tests.
:::

## Coverage

```bash
make backend-test-coverage
```

This writes `coverage.out` and renders `coverage.html` in `backend/`. Clean up
the artifacts with `make backend-test-clean`.

## Mocks

Service interfaces are mocked with mockery. Regenerate all mocks after changing an
interface:

```bash
make backend-mock-generate
```

The generated `mock_*.go` files are committed and must not be hand-edited.

## Spec conformance

The `internal/specconformance` package contains tests asserting that the running
server matches the OpenAPI spec. These run as part of `make backend-test` and
help catch drift between the implementation and
[the spec](/developer-guide/backend/api-and-openapi/).

## Before you commit

Run the same checks CI runs:

```bash
make backend-test     # unit tests (-race)
make backend-check    # lint + vulncheck + security
```

Run `make backend-test-integration` as well when you touch the repository layer
or migrations. See [Database & Migrations](/developer-guide/backend/database/).
