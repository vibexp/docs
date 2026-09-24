---
title: Testing
description: Unit tests, integration tests, end-to-end tests, coverage, and mocks for the VibeXP backend.
---

The backend has two layers of automated tests: fast unit tests that run
everywhere, and integration tests that exercise the repositories against a real
Postgres. Tests use [testify](https://github.com/stretchr/testify) for assertions
and [mockery](https://github.com/vektra/mockery)-generated mocks for service
interfaces. On top of those, an on-demand end-to-end suite drives the full
stack with Playwright (see below).

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

Integration tests run against a **live Postgres** instance: locally via Docker
Compose, in CI via a service container. They are gated behind the `integration`
build tag, so the default `make backend-test` does not run them.

Three packages carry integration-tagged files: the repository layer
(`internal/repositories/postgres/...`), the scheduler (`internal/scheduler/...`),
and the project-migration service (`internal/services/projectmigration/...`).
Note that `make backend-test-integration` above runs only the repository layer;
`make backend-test-coverage-integration` runs the whole tagged set.

- Override the target database with the `POSTGRES_TEST_DSN` environment variable.
- The timeout is 180s to allow for migrations and real I/O.

Locally, `make backend-test-coverage-integration` runs both suites in one
process against a real Postgres. In CI the suite is **sharded** (since #638):
the `unit` job runs the whole module untagged
(`make backend-test-unit-coverage`, no Postgres) and the `integration` job runs
only the integration-tagged packages
(`make backend-test-integration-coverage`) against a Postgres service
container. `make backend-check-integration-shard` guards the split: an
integration-tagged file added to a package outside that list fails CI until the
package is added to it. Both jobs publish coverage, so integration coverage
counts toward the reported total.

:::tip
Start the local stack first (`make backend-run-dev` brings up Postgres), or point
`POSTGRES_TEST_DSN` at any reachable test database before running integration
tests.
:::

## End-to-end tests

```bash
make e2e
```

The e2e suite is **production-like**: `docker-compose.e2e.yml` builds the
combined image (backend serving the embedded SPA) from source and boots it with
Postgres, a fake-gcs emulator (plus a `gcs-init` bucket bootstrap), and an
**a2a-test-agent** (a toy A2A agent built from `backend/cmd/a2a-test-agent/`,
exposed to the suite via `E2E_A2A_AGENT_URL`) so Playwright can register an
agent and chat with it end to end. It then runs the frontend's Playwright
tests against the running stack. `make e2e` does everything: installs the Playwright
browser, builds and boots the stack, runs the suite, and always tears the stack
down. The individual steps are also available:

| Target | Purpose |
| --- | --- |
| `make e2e-up` | Build and start the e2e stack, blocking until every service is healthy. |
| `make e2e-down` | Tear the stack down. |
| `make e2e-browsers` | Install the Playwright browser. |
| `make e2e-test` | Run the Playwright suite against a running stack (`PLAYWRIGHT_BASE_URL`). |

In CI the suite runs **on demand only** via the `ci-e2e.yml` workflow
(`workflow_dispatch` — trigger it from the Actions tab or with
`gh workflow run ci-e2e.yml -f branch=<ref>`). It is intentionally not wired to
every PR: building the combined image and booting the full stack is too heavy
to gate each push. The workflow delegates to the same `make e2e`, so a green
run there means the same command is green locally.

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

`internal/specconformance` is a **helper library, not a test suite**. A handler
test calls `specconformance.AssertConformsToSpec` on a recorded response, which
validates the payload against `openapi.yaml` using
[pb33f/libopenapi-validator](https://github.com/pb33f/libopenapi-validator) and
records that the operation now has spec-validated coverage. It lives in its own
package (rather than `internal/testutils`, which imports `internal/server`) so
that `internal/server` tests can import it without an import cycle.

Three gates in `internal/server` build on it, and all of them run under
`make backend-test` and the CI `unit` job:

| Gate | File | What it enforces |
| --- | --- | --- |
| Route drift | `openapi_drift_test.go` | Mounted routes and documented paths agree. |
| Payload-coverage ledger | `openapi_payload_coverage_test.go` | Every documented operation is either spec-validated or carries an explicit ledger entry. Shrink only: delete entries, never add. |
| Required arrays never null | `required_array_null_test.go` | A spec-required array response field never serializes as `null`. |

:::caution
The ledger check is enforced in `TestMain`, **after** the full package suite,
and it is skipped on partial runs (`-run`, `-skip`, `-list`, `-short`). A green
`go test -run TestFoo` therefore proves nothing about it.
:::

See [Response conformance](/developer-guide/backend/api-and-openapi/#response-conformance)
for how to convert a domain.

## Before you commit

Run the same checks CI runs:

```bash
make backend-test     # unit tests (-race)
make backend-check    # lint + vulncheck + security
```

Run `make backend-test-integration` as well when you touch the repository layer
or migrations. See [Database & Migrations](/developer-guide/backend/database/).
