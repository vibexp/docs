---
title: Pre-commit & CI
description: The mandatory pre-commit hooks, what CI enforces, and how VibeXP releases the combined container image from a single v* git tag.
---

VibeXP gates every commit on the same checks CI runs. Installing and respecting
the pre-commit hooks is **mandatory** — it is the fastest way to keep your PR
green.

## Install the hooks

Do this once per clone:

```bash
pre-commit install
```

You need `pre-commit` on your machine (`pipx install pre-commit` or
`brew install pre-commit`). If it is missing, install it before committing.

:::danger[Never bypass the hooks]
`git commit --no-verify`, `git push --no-verify`, and `-n` are **forbidden**. If
a hook fails, fix the underlying cause rather than skipping it.
:::

## What the hooks gate

The hooks are configured in `.pre-commit-config.yaml`. They run only against the
relevant files (backend hooks on `backend/`, frontend hooks on `frontend/`).

### Backend (Go)

- **gofmt check** — code must be `gofmt -s` clean.
- **golangci-lint** — the full linter suite.
- **go vulnerability check** — `govulncheck`.
- **go security scan** — `gosec`.
- **OpenAPI validation** — validates the spec when `openapi.yaml`, `paths/`, or
  `schemas/` change.
- **OpenAPI embedded bundle drift**: the runtime-served bundle in
  `internal/server/openapispec/` must be regenerated with the spec.
- **Block `os.Getenv`** — config must go through the config package, not
  `os.Getenv`.

### Frontend (TypeScript / React)

- **lint-staged** (format & autofix), **eslint**, **type-check** (`tsc -b`),
  **test** (Vitest), and **build**.
- **security scan**, **dependency audit** (on lockfile changes), and a
  **complexity check**.

### Repo-wide & policy hooks

- **gitleaks** — secret detection.
- **trailing-whitespace**, **end-of-file-fixer**, **check-yaml**,
  **check-json**, **check-added-large-files**, **check-merge-conflict**,
  **check-case-conflict**.
- **no-commit-to-branch** — blocks direct commits to `main`.
- **Block `nolint` comments** (backend) and **block `eslint-disable`**
  (frontend) — suppressions are not allowed outside the documented exceptions.
- **no-docs-directory**: a top-level `docs/` tree is rejected. Documentation
  lives in the [vibexp/docs](https://github.com/vibexp/docs) repo (published
  at docs.vibexp.io), not here. Package-level `README.md` files next to the
  code they describe are the sanctioned exception.

:::note
A duplicate-migration check (`.github/scripts/check-duplicate-migrations.sh`)
is available locally via `make backend-check-migrations` and runs in CI as a
**PR-only** `migrations` job in merge mode against `origin/main`, catching two
PRs that claim the same migration sequence number. The
`migration-renumbering` PR label is the escape hatch for deliberate
renumberings such as post-release consolidations.
:::

## Pinned tool versions

CI pins every analyzer, and the pre-commit hooks invoke whatever binary is on
your `PATH`, so a version skew either way reports failures CI does not. Install
the exact versions:

| Tool | Pinned version |
| --- | --- |
| Go toolchain | `go1.25.12` (`GOTOOLCHAIN` in the Makefile) |
| golangci-lint | `v2.12.2` |
| gosec | `v2.28.0` |
| govulncheck | `v1.6.0` |
| mockery | `v2.53.6` |
| redocly | `2.5.0` |

## What CI runs

CI runs the **same `make` targets** you run locally, so a clean local run is the
best predictor of a green build.

### `ci.yml`

Backend and frontend CI are consolidated into a single `ci.yml` (issue #390),
fanned out into parallel jobs (#638). Its jobs:

| Job | What it does |
| --- | --- |
| `changes` | Path filter (`dorny/paths-filter`) that decides which downstream jobs run. |
| `migrations` | PR-only duplicate-migration gate (merge mode against `origin/main`); skipped when the PR carries the `migration-renumbering` label. |
| `unit` | Backend build plus the **untagged** test suite (whole module, no Postgres), with coverage. Also gates the config-schema, Wire, and mock drift checks. |
| `integration` | The `integration`-tagged tests only (`internal/repositories/postgres` and `internal/services/projectmigration`, pinned in the Makefile) against a `pgvector` Postgres service container, with coverage. |
| `security` | `govulncheck` + `gosec` (split out of the test job in #638). |
| `lint` | Backend `golangci-lint`. |
| `openapi` | OpenAPI validation plus the embedded-bundle and strict-server drift checks. |
| `frontend-static` | Frontend install, lint, dependency audit, and type-check. |
| `frontend-test` | Frontend Vitest coverage run plus the production build. |
| `sonar` | SonarCloud scan fed by the unit, integration, and frontend coverage artifacts. |

The Go test suite is **sharded** across `unit` (untagged) and `integration`
(`-tags=integration`), and the two halves must stay exhaustive together;
`make backend-check-integration-shard` guards that no integration-tagged file
lands in a package outside the pinned list. CI restores a shared Go build
cache on every Go job; the `unit` job is the sole saver (on pushes to `main`
and on a total cache miss).

The `go-version` in this workflow must stay in sync with `GO_VERSION`
(`1.25.12`) in the `Makefile`.

The **SonarCloud quality gate is blocking** (since #371/#397): a red gate fails
CI. Coverage artifacts from both the backend and frontend test jobs feed the
scanner.

### `ci-e2e.yml` (on-demand)

The production-like end-to-end suite (Playwright) is **not** wired to PRs — it
builds the combined image from source and boots a full stack (Postgres +
fake-gcs + the backend serving the embedded SPA), which is too heavy to gate
every PR. Run it manually via `workflow_dispatch` (Actions tab, or
`gh workflow run ci-e2e.yml -f branch=<ref>`) against any branch. It delegates
to `make e2e`, so a green run there means the same `make e2e` is green locally.

## Releases

There is one combined artifact and one release workflow, `release.yml`. Creating
a GitHub Release with a `vX.Y.Z` tag builds the combined image (frontend SPA
embedded into the Go backend) and publishes it:

| Release tag | Image built                                                        |
| ----------- | ------------------------------------------------------------------ |
| `vX.Y.Z`    | `ghcr.io/vibexp/vibexp:X.Y.Z` (+ `:latest` for non-prereleases)     |

A `workflow_dispatch` input is available as a manual escape hatch to build from
the current ref without a release. The old per-component `backend-v*` /
`frontend-v*` tags (and their split images) are legacy and no longer released.

Once the image is published, the release workflow's `dispatch-cli-e2e` job
cross-repo dispatches the [VibeXP CLI](https://github.com/vibexp/cli)
end-to-end suite against the latest CLI release with the new platform image,
and links the run in the job summary. It is dispatch-and-link only: the CLI
verdict is never awaited and cannot fail or roll back a release.

## SHA-pinned actions

Every external GitHub Action referenced with `uses:` **must** be pinned to a full
40-character commit SHA, with the human-readable version in a trailing comment.
Mutable tag references (`@v4`, `@main`) are rejected.

```yaml
# correct
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2

# rejected
- uses: actions/checkout@v6
```

Internal reusable workflows referenced by path (`uses: ./.github/...`) are
exempt.
