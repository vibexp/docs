---
title: Getting Started
description: Set up a local VibeXP development environment from zero and run the backend and frontend with hot reload.
---

This page takes you from a fresh clone to a running backend and frontend, both
with hot reload. Local development is driven entirely by the root `Makefile`.

:::caution
The root `docker-compose.yml` runs the **published** `ghcr.io/vibexp/*` images
for self-hosting — it is **not** the dev workflow. To develop VibeXP, use the
`make` targets below.
:::

## Prerequisites

- **Docker + Compose** — used to run PostgreSQL (with pgvector) and Mailpit
  locally. `docker-compose` or `podman-compose` both work.
- **Go 1.25.x** — the `Makefile` pins `GOTOOLCHAIN=go1.25.11`, so Go downloads
  and uses that exact toolchain on demand even if your system Go is newer.
- **Node.js >= 20** — for the frontend (its `engines` field requires `>=20`).
- **`pre-commit`** — required; commits are gated on it. Install with
  `pipx install pre-commit` or `brew install pre-commit`.
- **air** — for backend hot reload. Install with
  `go install github.com/air-verse/air@latest`.

## Clone the repository

```bash
git clone https://github.com/vibexp/vibexp.git
cd vibexp
```

## Install the pre-commit hooks

Do this once per clone, before your first commit. The hooks run the same checks
CI runs.

```bash
pre-commit install
```

:::danger
Never bypass the hooks (`--no-verify` / `-n` is forbidden). If a hook fails, fix
the cause. See [Pre-commit & CI](/developer-guide/contributing/pre-commit-and-ci/).
:::

## Run the backend

```bash
make backend-run-dev
```

This target:

- starts **PostgreSQL** and **Mailpit** via Compose,
- starts the API under **air** for hot reload on any `.go` change.

The local email inbox (Mailpit) UI is at **http://localhost:8025**, and the API
serves on **http://localhost:8080** (health check at
`http://localhost:8080/health`).

:::note[Where `.env` comes from]
On first run, if `backend/.env` is missing it is **auto-copied from
`backend/.env.example`** with dev defaults — there is nothing to configure to
start. Only `.env.example` is tracked in git; your `.env` is gitignored.
:::

## Run the frontend

In a second terminal:

```bash
make frontend-run-dev
```

This copies `frontend/.env` from `.env.example` if missing, installs
dependencies if `node_modules` is absent, and starts the **Vite dev server at
http://localhost:5173**.

## Dev-login bypass (no WorkOS needed locally)

You do **not** need a WorkOS account to develop locally. The dev defaults enable
a dev-login bypass (`DEV_LOGIN_ENABLED`), so you can sign in and click around
immediately. WorkOS / OIDC is only required for real deployments — see the
self-hosting docs for production auth configuration.

## Common checks

Run these before committing (CI runs the same targets):

```bash
# Backend
make backend-test         # go test -race ./...
make backend-lint         # golangci-lint
make backend-check        # lint + vulncheck + security scan

# Frontend
make frontend-test        # vitest
make frontend-lint        # eslint
make frontend-type-check  # tsc
```

## Where to go next

- **[Contribution Workflow](/developer-guide/contributing/workflow/)** — branch,
  commit, and PR conventions.
- **[Code Conventions](/developer-guide/contributing/code-conventions/)** — the
  spec-first model and the regeneration commands.
