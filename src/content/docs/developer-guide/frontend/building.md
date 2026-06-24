---
title: Building & Serving
description: How the VibeXP frontend is built and served — make frontend-build, the multi-stage Docker image, the nginx proxy, SPA fallback, and the release flow.
---

The frontend ships as a static build served by nginx. This page covers building
it and how the production image is assembled.

## Local build

```bash
make frontend-build
```

This runs the production build (TypeScript type-check followed by `vite build`),
emitting static assets to `frontend/dist/`. For day-to-day work use
`make frontend-run-dev` instead — see
[Frontend Overview](/developer-guide/frontend/overview/).

## The Docker image

[`frontend/Dockerfile`](https://github.com/vibexp/vibexp/blob/main/frontend/Dockerfile)
is multi-stage:

1. **Build stage (`node:22-alpine`).** Runs `npm ci`, then `npm run build`. The
   `VITE_*` values are passed as build args and **inlined into the bundle** here.
   They default to deployment-neutral values (relative API base, integrations
   disabled).
2. **Runtime stage (`nginx:1.27-alpine`).** Copies the built `dist/` into
   `/usr/share/nginx/html` and the nginx template into
   `/etc/nginx/templates/`. Exposes port 80.

Because `@vibexp/api-client` and `@vibexp/design-system` resolve from public
npm, the build needs no monorepo context and no registry auth token.

## nginx, `BACKEND_ORIGIN`, and the API proxy

The runtime stage sets a single runtime variable:

```dockerfile
ENV BACKEND_ORIGIN=http://backend:8080
```

The nginx image renders
[`nginx.conf.template`](https://github.com/vibexp/vibexp/blob/main/frontend/nginx.conf.template)
with `envsubst` at container start, substituting **only** declared variables
(`BACKEND_ORIGIN`) so nginx's own runtime variables (`$uri`, `$host`,
`$upstream`, …) are preserved.

The template does two things:

```nginx
# Reverse-proxy /api/ to the backend.
location /api/ {
    resolver 127.0.0.11 ipv6=off valid=10s;
    set $upstream "${BACKEND_ORIGIN}";
    proxy_pass $upstream$request_uri;
    # ...forwarded headers...
}

# SPA fallback: serve assets, fall back to index.html for client routes.
location / {
    try_files $uri $uri/ /index.html;
}
```

:::note[Runtime DNS resolution]
The upstream is assigned to a variable (`$upstream`) so nginx resolves it at
**request** time via Docker's embedded DNS (`127.0.0.11`), not at startup. nginx
boots even if the backend is briefly unavailable, and transparently picks up a
new backend IP after a restart.
:::

The `try_files … /index.html` fallback is what makes deep links to client-side
routes work — any path that is not a real file is served the SPA shell.

## Sentry source maps

When `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are all set at build
time (typically in CI), the Sentry build plugin uploads hidden source maps to
Sentry and then **deletes** the `.map` files from the output so they are never
deployed publicly. With those variables unset, the build works normally and no
maps are uploaded. See
[Frontend Configuration](/developer-guide/frontend/configuration/).

## Published image & release flow

The built image is published to GitHub Container Registry as
`ghcr.io/vibexp/frontend`. Releases are cut via prefixed Git tags: a
`frontend-vX.Y.Z` GitHub Release builds and pushes
`ghcr.io/vibexp/frontend:X.Y.Z` (and `:latest`). The backend is released the same
way via `backend-vX.Y.Z` tags.

The root `docker-compose.yml` pulls these published images — see
[Self-Hosting](/developer-guide/deployment/self-hosting/) and
[Docker & Compose](/developer-guide/deployment/docker/).
