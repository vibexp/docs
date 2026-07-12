---
title: Building & Serving
description: How the VibeXP frontend is built and served — make frontend-build, the embedfrontend build tag, the combined multi-stage Docker image, SPA fallback in the Go backend, and the release flow.
---

The frontend ships as a static build **embedded into the Go backend binary**.
One combined image serves the SPA and the API from a single port — no separate
frontend container. This page covers building it and how the production image is
assembled.

## Local build

```bash
make frontend-build
```

This runs the production build (`npm run build`: `scripts/generate-sw-config.js`
first, then TypeScript type-check and `vite build`), emitting static assets to
`frontend/dist/`. The generate step writes the Firebase service-worker config
from the `VITE_FIREBASE_*` variables. For day-to-day work use
`make frontend-run-dev` instead — see
[Frontend Overview](/developer-guide/frontend/overview/).

## The combined binary

```bash
make build-combined
```

This mirrors what the release image does, locally:

1. Builds the frontend (`make frontend-build`).
2. Copies `frontend/dist` to `backend/internal/server/dist`.
3. Builds the backend with `go build -tags embedfrontend`, producing one binary
   (`backend/bin/vibexp`) that serves the SPA **and** the API from one port.

Local development does **not** need this — run `make backend-run-dev` and
`make frontend-run-dev` as two independent processes.

## The `embedfrontend` build tag

Whether the SPA is embedded is a compile-time switch in
`backend/internal/server/`:

- **`spa_embed.go`** (`//go:build embedfrontend`) — `//go:embed`s
  `internal/server/dist`, populated with the frontend build output. Compiled
  only in the combined release build.
- **`spa_noembed.go`** (`//go:build !embedfrontend`) — the default build. No
  frontend is embedded, so the backend compiles and runs with no built
  `frontend/dist` present (local dev + CI); the Vite dev server serves the SPA
  instead.

## SPA serving and fallback

`backend/internal/server/spa.go` registers a catch-all that runs only when no
API/MCP/OAuth route matched. It serves, in order:

- **`/config.js`** — the runtime frontend configuration
  (`window.__VIBEXP_ENV__`), rendered from the backend's `frontend.*` config in
  every build, embedded or not. See
  [Frontend Configuration](/developer-guide/frontend/configuration/).
- **Embedded static assets** — Vite's content-hashed `assets/` files are served
  with immutable, year-long cache headers; everything else (including
  `index.html`) is `no-cache` so a redeploy is picked up immediately.
- **`index.html` as the fallback** — any path that is not a real file is served
  the SPA shell, so deep links to client-side routes resolve.

:::note[Honest 404s]
Paths under the backend's own namespaces (`/api/`, `/mcp/`, `/oauth2/`,
`/.well-known/`, …) are never given the SPA fallback — an unmatched path there
is a genuine 404 (e.g. a typo'd API call), and returning HTML would mask it.
:::

Source maps are not generated (`sourcemap: false` in `vite.config.ts`), so none
end up in the embedded image.

## The Docker image

[`backend/Dockerfile`](https://github.com/vibexp/vibexp/blob/main/backend/Dockerfile)
builds the combined image. The build context is the **repo root** (not
`./backend`) so both `frontend/` and `backend/` are available:

```bash
docker build -f backend/Dockerfile .
```

It is multi-stage:

1. **Frontend stage (`node:22-alpine`).** Runs `npm ci`, then `npm run build`
   into `frontend/dist`. Only deployment-neutral build args are passed:
   `VITE_API_BASE_URL=/api/v1` (relative — the API is same-origin in the
   combined image) and the release stamps `VITE_RELEASE_SHA` /
   `VITE_RELEASE_DATE`. Branding/analytics are **not** build args — they are
   injected at runtime via `/config.js`.
2. **Backend stage (`golang:1.25.12-alpine`).** Copies the backend source,
   copies `frontend/dist` into `internal/server/dist`, and builds with
   `-tags embedfrontend`.
3. **Runtime stage (`alpine:3.20`).** Copies the binary and migrations, bakes a
   production-neutral default config, and exposes port **8080**.

Because `@vibexp/api-client` and `@vibexp/design-system` resolve from public
npm, the build needs no registry auth token.

## Published image & release flow

Releases are handled by a single workflow,
[`release.yml`](https://github.com/vibexp/vibexp/blob/main/.github/workflows/release.yml):
publishing a GitHub Release with a `vX.Y.Z` tag builds the combined image and
pushes `ghcr.io/vibexp/vibexp:X.Y.Z` (plus `:latest` for non-prereleases). The
workflow passes the commit SHA as `VITE_RELEASE_SHA`, and a
`workflow_dispatch` input is available as a manual escape hatch. This replaces
the earlier split `backend-v*` / `frontend-v*` releases — the frontend is no
longer published as a separate image.

The root `docker-compose.yml` pulls the published image — see
[Self-Hosting](/developer-guide/deployment/self-hosting/) and
[Docker & Compose](/developer-guide/deployment/docker/).
