---
title: Frontend Overview
description: Architecture of the VibeXP frontend — a Vite + React + TypeScript SPA served by nginx, how it talks to the backend, and the local dev loop.
---

The VibeXP frontend is a single-page application (SPA) that lives in the
[`frontend/`](https://github.com/vibexp/vibexp/tree/main/frontend) directory of
the [`vibexp/vibexp`](https://github.com/vibexp/vibexp) monorepo. It is built and
released independently from the backend.

## Tech stack

- **Vite** — build tool and dev server.
- **React 19** with **TypeScript** — UI layer.
- **React Router** — client-side routing.
- **nginx** — serves the static build in production and reverse-proxies the API.

Node.js **>= 20** is required (enforced by the `engines` field in
`package.json`).

## The two external `@vibexp/*` packages

The frontend consumes two npm packages that are **not** in this repo. Both are
maintained in separate repositories and resolved from the public npm registry:

- **`@vibexp/api-client`** — a typed API client generated from the backend's
  `openapi.yaml`. This is how the SPA calls the backend; you do not hand-write
  fetch calls against the REST API.
- **`@vibexp/design-system`** — the shared UI component library (design tokens,
  primitives, themed components).

Because both come from npm, the frontend build is fully standalone — no monorepo
workspace context and no auth token are needed to build it.

:::note[Changing the API surface]
The API client is generated from the backend spec. The change flow is: update
`backend/openapi.yaml` → release a new `@vibexp/api-client` (from its own repo)
→ bump the dependency in `frontend/package.json`.
:::

## `src/` layout

```text
frontend/src/
├── pages/        Route-level views (one per screen)
├── components/   Reusable presentational components
├── features/     Feature modules (domain-grouped UI + logic)
├── hooks/        Custom React hooks
├── contexts/     React context providers (auth, theme, …)
├── services/     API calls and side-effecting integrations
├── lib/          Third-party wiring and shared setup
└── utils/        Pure helpers and small utilities
```

## How it talks to the backend

The frontend is **deployment-agnostic**. It is built with a **relative** API
base URL — `VITE_API_BASE_URL=/api/v1` — so all requests are same-origin. In
production, nginx reverse-proxies `/api/` to the backend, whose location is set
at deploy time via the `BACKEND_ORIGIN` runtime variable (default
`http://backend:8080`).

This means the backend origin is **never baked into the build**. The same
published image works against any backend. See
[Frontend Configuration](/developer-guide/frontend/configuration/) for the
build-time vs runtime split, and
[Building & Serving](/developer-guide/frontend/building/) for the nginx proxy
details.

## Authentication flow (high level)

Authentication is handled by the **backend** via WorkOS AuthKit; the frontend
never holds API keys or OAuth secrets.

1. The user starts sign-in from the SPA, which redirects to the backend auth
   endpoint.
2. The backend completes the WorkOS flow and returns to the SPA's
   `/auth/callback` route.
3. The session is carried in an **httpOnly session cookie** set by the backend —
   it is not readable by JavaScript, and is sent automatically on same-origin
   `/api/v1` requests through the nginx proxy.

:::tip[Local evaluation]
For local development and self-host evaluation, a dev-login bypass
(`DEV_LOGIN_ENABLED=true`, localhost only) lets you sign in without a WorkOS
account. See [Self-Hosting](/developer-guide/deployment/self-hosting/).
:::

## Local dev loop

Local development uses the root `Makefile`, not Docker:

```bash
make frontend-run-dev
```

This installs dependencies if needed, copies `frontend/.env` from
`.env.example` if missing, and starts the Vite dev server at
**http://localhost:5173**.

## Key checks

Run these before committing (CI runs the same targets):

```bash
make frontend-install     # install dependencies
make frontend-lint        # eslint
make frontend-type-check  # tsc
make frontend-test        # tests
make frontend-build       # production build
```

## Next

- [Frontend Configuration](/developer-guide/frontend/configuration/) — the full
  `VITE_*` / build variable reference.
- [Building & Serving](/developer-guide/frontend/building/) — the Docker image
  and nginx serving model.
