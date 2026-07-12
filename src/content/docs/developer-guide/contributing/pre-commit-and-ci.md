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

- **lint-staged** (format & autofix), **eslint**, **type-check** (`tsc`),
  **test** (Jest), and **build**.
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

:::note
A duplicate-migration check (`.github/scripts/check-duplicate-migrations.sh`) is
available via `make backend-check-migrations` and is enforced in CI on merge to
catch two migrations claiming the same sequence number.
:::

## What CI runs

CI runs the **same `make` targets** you run locally, so a clean local run is the
best predictor of a green build.

### `ci-backend.yml`

```text
download-deps -> format -> build -> test
              + lint
              + OpenAPI validation
```

(`go mod download`, `gofmt` check, `go build`, `go test -race`, `golangci-lint`,
and OpenAPI spec validation. The OpenAPI job also checks config-schema drift
and embedded-bundle drift.) The `go-version` in this workflow must stay in sync
with `GO_VERSION` (`1.25.12`) in the `Makefile`.

### `ci-frontend.yml`

```text
install -> lint -> type-check -> test -> build
```

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
