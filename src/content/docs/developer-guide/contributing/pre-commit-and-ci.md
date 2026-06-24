---
title: Pre-commit & CI
description: The mandatory pre-commit hooks, what CI enforces, and how VibeXP releases container images from prefixed git tags.
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
- **Block `os.Getenv`** — config must go through the config package, not
  `os.Getenv`.

### Frontend (TypeScript / React)

- **lint-staged** (format & autofix), **eslint**, **type-check** (`tsc`),
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
and OpenAPI spec validation.) The `go-version` in this workflow must stay in sync
with `GO_VERSION` (`1.25.11`) in the `Makefile`.

### `ci-frontend.yml`

```text
install -> lint -> type-check -> test -> build
```

## Releases

The two components are released **independently** via prefixed git tags. Creating
a GitHub Release with the matching tag builds and publishes the container image:

| Release tag        | Image built                                          |
| ------------------ | ---------------------------------------------------- |
| `backend-vX.Y.Z`   | `ghcr.io/vibexp/backend:X.Y.Z` (+ `:latest`)         |
| `frontend-vX.Y.Z`  | `ghcr.io/vibexp/frontend:X.Y.Z` (+ `:latest`)        |

These are handled by `release-backend.yml` and `release-frontend.yml`.

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
