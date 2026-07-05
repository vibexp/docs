---
title: Code Conventions
description: The conventions that keep VibeXP consistent — the spec-first backend, generated code, the API change flow, and a deployment-agnostic frontend.
---

These conventions keep the codebase consistent and CI green. Match the style of
the surrounding code, and follow the rules below.

## Spec-first backend

`backend/openapi.yaml` — **bundled from `paths/` + `schemas/`** — is the single
source of truth for the API. You change the API by changing the spec, not by
hand-writing handlers.

The following are **generated and committed**, and must never be hand-edited:

- the **oapi-codegen** strict-server bindings,
- the **Wire** dependency-injection graph (`internal/container/wire_gen.go`),
- the **mocks** (`mock_*.go`).

Regenerate them with `make`, never by editing the generated files directly:

```bash
make backend-generate-openapi-server   # regenerate server bindings from the spec
make backend-wire-gen                  # regenerate the Wire DI graph
make backend-mock-generate             # regenerate mocks
```

Generated files must stay **`gofmt -s` clean**, and CI fails a PR when generated
code is stale relative to the spec (for example, `backend-wire-check` fails if
`wire_gen.go` drifts). See
[Code Generation](/developer-guide/backend/code-generation/) for the full set of
commands.

:::caution
Editing a `*_gen.go`, `mock_*.go`, or `wire_gen.go` file by hand will be
overwritten on the next regeneration and will fail CI. Change the source (spec,
provider set, or mock target) and regenerate instead.
:::

## API change flow

A change that touches the API contract flows through three repos in order:

1. **Update `backend/openapi.yaml`** (via `paths/` + `schemas/`) and regenerate
   the server bindings.
2. **Release a new `@vibexp/api-client`** from the `api-client-js` repo — the
   typed client is generated from the spec.
3. **Bump the `@vibexp/api-client` dependency** in the frontend and build against
   it.

## Deployment-agnostic frontend

The frontend never hardcodes a backend origin. It is built with a relative base
URL:

```text
VITE_API_BASE_URL=/api/v1
```

In production, **the backend serves the SPA from the same origin** as the API
(the combined image), so relative requests just work. Keep API calls relative so
the same build runs against any deployment. Likewise, deploy-time frontend
values (branding, MCP endpoint, analytics) are injected at **runtime** via the
backend-rendered `/config.js` (`window.__VIBEXP_ENV__`) — never baked into the
bundle.

### No precaching service worker

VibeXP does **not** ship a PWA/precaching service worker. The only worker is the
on-demand `firebase-messaging-sw.js` for push. `src/utils/serviceWorker.ts` and
`public/{sw,dev-sw}.js` exist solely to evict legacy workers. Do not reintroduce
a precaching service worker without a cleanup story.

## Secrets and environment

- `.env` is **gitignored** — never commit it.
- Only `.env.example` is tracked, and it uses **neutral placeholder values**
  (e.g. `example.com`) because the repository is public and self-hosted.
- On the backend, read configuration through the config package, **not**
  `os.Getenv` (a pre-commit hook blocks `os.Getenv`).

## Style

Match the conventions of the code around your change. The linters
(`golangci-lint` on the backend, ESLint + `tsc` on the frontend) are the
authority — run them locally before committing. See
[Pre-commit & CI](/developer-guide/contributing/pre-commit-and-ci/) for the full
list of gated checks.
