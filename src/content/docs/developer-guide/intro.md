---
title: Developer Guide
description: An orientation to the VibeXP codebase for contributors — the monorepo layout, the tech stack, and where to go next.
---

This guide is for people who want to **build VibeXP**, not just use it. It covers
how the codebase is organized, how to run it locally, the conventions that keep
the project consistent, and how to get a change merged.

If you are only running or self-hosting VibeXP, the
[User Guide](/user-guide/) and [Self-Hosting](/user-guide/self-hosting/) pages
are the better starting point.

## What VibeXP is

VibeXP is an open-source, self-hostable AI command center: one shared knowledge
base for prompts, blueprints, memory, artifacts, feeds, and MCP integrations
that every AI tool (Claude Code, Cursor, VS Code, and anything that speaks MCP)
can read from and write back to.

The project is open source under **AGPL-3.0-or-later** and lives in a single
public repository:

```text
https://github.com/vibexp/vibexp
```

## Monorepo layout

The repository is a **monorepo with two independently deployable components**.
Each ships as its own container image and is released on its own cadence.

```text
backend/   Go REST API (module github.com/vibexp/vibexp)
           cmd/         cobra commands
           internal/    server, services, repositories, auth, container (Wire DI)
           migrations/  SQL migrations
           openapi.yaml + paths/ + schemas/   API source of truth
           Dockerfile

frontend/  Vite + React + TypeScript SPA
           src/         pages, components, features, hooks, services, lib, utils
           Dockerfile
           nginx.conf.template   reverse-proxies /api -> BACKEND_ORIGIN

Makefile             all dev/CI tasks (backend-*, frontend-*)
docker-compose.yml   runs PUBLISHED ghcr.io/vibexp/* images + Postgres (self-host, NOT for dev)
.github/workflows/   ci-backend, ci-frontend, release-backend, release-frontend
```

:::note
Only `backend/` and `frontend/` live in this repository. The marketing site,
docs site, blog, CLI, and the `@vibexp/api-client` source each live in their own
repos under the [`vibexp` organization](https://github.com/vibexp).
:::

## Tech stack

### Backend (`backend/`)

- **Go** REST API, module `github.com/vibexp/vibexp`. The toolchain is pinned to
  **Go 1.25.11** (`GOTOOLCHAIN=go1.25.11` in the `Makefile`) so local builds
  match CI exactly.
- **Spec-first OpenAPI.** `backend/openapi.yaml` — bundled from `paths/` and
  `schemas/` — is the single source of truth. The strict server bindings, Wire
  dependency-injection graph, and mocks are all **generated and committed**, then
  regenerated via `make` (never hand-edited).
- **PostgreSQL + pgvector** for storage and semantic search.
- **MCP endpoint** so AI tools connect over the Model Context Protocol.
- **WorkOS / OIDC auth** in production, with a dev-login bypass for local work.

### Frontend (`frontend/`)

- **Vite + React + TypeScript** single-page app, served by **nginx** in
  production.
- **Deployment-agnostic.** Built with a relative `VITE_API_BASE_URL=/api/v1`;
  nginx proxies `/api/` to the backend (`BACKEND_ORIGIN`). The frontend never
  hardcodes a backend origin.

### Shared packages

The frontend consumes two npm packages that do **not** live in this repository:

- **`@vibexp/api-client`** — the typed API client generated from
  `backend/openapi.yaml` (source repo: `api-client-js`).
- **`@vibexp/design-system`** — the shared UI component library.

Both resolve from public npm; a fresh `npm install` needs no auth token.

## How a change flows through the codebase

A typical end-to-end change touches the spec first, then the generated client,
then the frontend:

1. Edit `backend/openapi.yaml` (via `paths/` + `schemas/`) and regenerate the
   server bindings.
2. Release a new `@vibexp/api-client` from the `api-client-js` repo.
3. Bump the `@vibexp/api-client` dependency in the frontend and build against it.

See [Code Conventions](/developer-guide/contributing/code-conventions/) for the
details of this flow.

## Where to go next

- **[Getting Started](/developer-guide/getting-started/)** — set up a local dev
  environment from zero and run both servers with hot reload.
- **[Contribution Workflow](/developer-guide/contributing/workflow/)** — branch,
  commit, and PR conventions.
- **[Pre-commit & CI](/developer-guide/contributing/pre-commit-and-ci/)** — the
  mandatory hooks and what CI enforces.
- **[Code Conventions](/developer-guide/contributing/code-conventions/)** — the
  spec-first model, generated code, and project-wide rules.
- **[Self-Hosting](/user-guide/self-hosting/)** — how the components are deployed
  and configured.
