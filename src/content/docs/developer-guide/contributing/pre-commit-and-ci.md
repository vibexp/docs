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
**PR-only** `migrations` job in merge mode against the branch the PR targets
(`main` normally, the `release/X.Y.x` line for a backport), catching two
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
| Go toolchain | `go1.25.13` (`GOTOOLCHAIN` in the Makefile) |
| Node | `22` in CI; `>=22.22.0` in `frontend/package.json` `engines` |
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
| `changes` | Path filter (`dorny/paths-filter`) that decides which downstream jobs run. On a **fork** PR it also uploads a `pr-number` artifact, which `sonar-fork.yml` consumes. |
| `migrations` | PR-only duplicate-migration gate (merge mode against the branch the PR targets), and only when the PR touches `backend/migrations/`; skipped when the PR carries the `migration-renumbering` label. |
| `unit` | Backend build plus the **untagged** test suite (whole module, no Postgres), with coverage. Also gates the config-schema, Wire, and mock drift checks. |
| `integration` | The `integration`-tagged tests only (`internal/repositories/postgres`, `internal/scheduler`, and `internal/services/projectmigration`, pinned in the Makefile) against a `pgvector` Postgres service container, with coverage. |
| `security` | `govulncheck` + `gosec` (split out of the test job in #638). |
| `lint` | Backend `golangci-lint`. |
| `openapi` | OpenAPI validation plus the embedded-bundle and strict-server drift checks. |
| `frontend-static` | Frontend install, lint, dependency audit, and type-check. |
| `frontend-test` | Frontend Vitest coverage run plus the production build. |
| `sonar` | SonarCloud scan fed by the unit, integration, and frontend coverage artifacts. Skipped for fork PRs (see `sonar-fork.yml`) and for `release/**` pushes. |

The Go test suite is **sharded** across `unit` (untagged) and `integration`
(`-tags=integration`), and the two halves must stay exhaustive together;
`make backend-check-integration-shard` guards that no integration-tagged file
lands in a package outside the pinned list. CI restores a shared Go build
cache on every Go job; the `unit` job is the sole saver (on pushes to `main`
and on a total cache miss).

The `go-version` in this workflow must stay in sync with `GO_VERSION`
(`1.25.13`) in the `Makefile`.

CI runs on every pull request, and on pushes to `main` and to `release/**`
branches. A release line branch needs its own run because a patch release is tagged from
its tip; PRs into a release branch already run through the unfiltered
`pull_request` trigger. Two things are deliberately narrower than the trigger:
Sonar is **skipped on release-branch pushes** (main is the coverage baseline,
and a line branch is main-as-of-the-last-tag plus cherry-picks, so scanning it
would publish a second permanently lagging baseline), and Go build-cache
**saving** stays pinned to `refs/heads/main`, since a cache saved on any other
branch is visible only to that branch.

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

### `sonar-fork.yml` (new in v0.11.0)

A `pull_request` run originating in a **fork** receives no repository secrets,
permanently and by design, so `SONAR_TOKEN` is empty there and the scanner
cannot authenticate. With a blocking quality gate that meant no outside
contribution could produce a green run. So `ci.yml`'s `sonar` job now **skips**
fork PRs, and this `workflow_run` companion analyses them from the **base
repository's** context, using the coverage artifacts the fork's own CI run
uploaded.

The two conditions are exact complements. The test on both sides is "the head
repo is not this repo", not `head.repo.fork`; changing one without the other
silently disables Sonar on every PR.

:::danger[No step in `sonar-fork.yml` may execute anything from the repository]
The job holds `SONAR_TOKEN` and a `statuses: write` token while checking out
untrusted fork code. No `make`, no `npm install`, no `go build`, no
`./scripts/…`, no local composite action. That invariant is the entire basis of
the design's safety. Two supporting constraints: `sonar-project.properties` is
restored from the **default branch**, never taken from the PR (a fork would
otherwise control `sonar.sources`, `sonar.exclusions` and the coverage report
paths), and artifacts are downloaded by the **triggering run's id**, not by name
alone. If you need to run something from the tree, it belongs in `ci.yml`, which
has no secrets.
:::

### `stale.yml`

The daily stale sweep covers **issues and pull requests** on separate budgets
(PRs were added in v0.11.0). PRs get the longer window on purpose: a quiet PR is
more often waiting on maintainer review than abandoned.

| Track | Idle before the `Stale` label | Reminder | Closed | Exempt labels |
| --- | --- | --- | --- | --- |
| Issues | 7 days | 7 days after the label | 14 days after the label | `pinned`, `epic`, `security` |
| Pull requests | 14 days | 7 days after the label | 14 days after the label | `pinned`, `security` |

Draft PRs are **not** exempt: they are the most common source of abandoned
branches. Any genuine (non-bot) activity removes the label and resets the
clock, and for a PR that includes pushes, reviews and review-thread comments,
not just issue comments.

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
