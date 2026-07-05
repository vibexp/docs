---
title: Frontend Overview
description: Architecture of the VibeXP frontend — a Vite + React + TypeScript SPA embedded in and served by the Go backend, how it talks to the backend, and the local dev loop.
---

The VibeXP frontend is a single-page application (SPA) that lives in the
[`frontend/`](https://github.com/vibexp/vibexp/tree/main/frontend) directory of
the [`vibexp/vibexp`](https://github.com/vibexp/vibexp) monorepo. In production
it is **embedded into the Go backend** and shipped as one combined
artifact/release — a single image serves the SPA and the API.

## Tech stack

- **Vite** — build tool and dev server.
- **React 19** with **TypeScript** — UI layer.
- **React Router** — client-side routing.

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

In production the frontend and the API share **one origin**: the backend serves
the embedded SPA and the API from the same port, so the image is built with a
**relative** API base URL (`VITE_API_BASE_URL=/api/v1`) and all requests are
same-origin. Deploy-time values (branding, MCP endpoint, analytics) are not
baked into the bundle either — the backend renders them at runtime as
`/config.js` (`window.__VIBEXP_ENV__`), loaded before the SPA bundle.

In local development the two run as separate processes: the Vite dev server on
**:5173**, the backend on **:8080**, and the SPA calls the backend directly —
the `.env.example` default is `VITE_API_BASE_URL=http://localhost:8080/api/v1`.
There is no backend-rendered `/config.js` in dev; the app falls back to the
build-time `import.meta.env` values.

See [Frontend Configuration](/developer-guide/frontend/configuration/) for the
build-time vs runtime split, and
[Building & Serving](/developer-guide/frontend/building/) for how the SPA is
embedded and served.

## Authentication flow (high level)

Authentication is handled by the **backend's provider registry** (Google,
GitHub, generic OIDC — `auth.providers` in the backend config); the frontend
never holds OAuth secrets.

1. The sign-in page fetches `GET /api/v1/auth/providers` and renders a
   **provider picker** from whatever this deployment has enabled
   (`src/services/authService.ts`).
2. Picking a provider asks the backend for the identity-provider login URL
   (`/auth/login?provider=…`) and redirects the browser there. The backend
   completes the OAuth flow and returns to the SPA's `/auth/callback` route.
3. The session is carried in an **httpOnly session cookie** set by the backend —
   it is not readable by JavaScript, and is sent automatically on same-origin
   `/api/v1` requests.

The SPA also hosts the **OAuth consent page** (`/oauth/consent`,
`src/pages/auth/OAuthConsentPage.tsx`) for the backend's embedded MCP
Authorization Server: it gates on an app login (redirecting signed-out users to
`/login` with a `return_to` back to the same consent URL), then posts the
approve/deny decision.

:::tip[Local evaluation]
For local development and self-host evaluation, a dev-login bypass — backend
config `auth.dev_login_enabled: true`, effective only when the environment is
detected as development — lets you sign in without any OAuth provider. See
[Self-Hosting](/developer-guide/deployment/self-hosting/).
:::

## Local dev loop

Local development uses the root `Makefile`, not Docker:

```bash
make frontend-run-dev
```

This bootstraps `frontend/.env` via `scripts/sync-env.sh frontend` (copies
`.env.example` if `.env` is missing, and appends any newly-introduced keys after
a pull), installs dependencies if needed, and starts the Vite dev server at
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
  `VITE_*` / runtime `/config.js` reference.
- [Building & Serving](/developer-guide/frontend/building/) — the combined
  Docker image and how the backend embeds and serves the SPA.
