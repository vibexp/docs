---
title: Frontend Configuration
description: Reference for the VibeXP frontend's build-time VITE_* variables and the runtime /config.js configuration rendered by the backend.
---

The frontend is configured through environment variables. The canonical list and
defaults live in
[`frontend/.env.example`](https://github.com/vibexp/vibexp/blob/main/frontend/.env.example).

## Build-time vs runtime

This is the most important distinction:

- **`VITE_*` variables are inlined at _build_ time.** They are baked into the
  JavaScript bundle when `vite build` runs. In practice you set them in
  `frontend/.env` for **local development** (the Vite dev server reads them);
  the published image bakes only deployment-neutral values.
- **Deploy-time values come from the _runtime_ `/config.js`.** In production the
  backend renders `/config.js` from its `frontend.*` configuration (see
  [Backend Configuration](/developer-guide/backend/configuration/)), setting
  `window.__VIBEXP_ENV__` before the SPA bundle runs. Branding, site links, MCP
  endpoint, and analytics are all injected this way — changing them needs a
  restart, **not a rebuild**. In local dev there is no backend-rendered
  `/config.js` (the request 404s harmlessly) and the app falls back to the
  build-time `import.meta.env` values.

:::tip[Why the API base URL is relative]
The published image is built with `VITE_API_BASE_URL=/api/v1` so requests are
same-origin — the backend serves the SPA and the API from the same port. Do not
hardcode a backend origin into the build. See
[Building & Serving](/developer-guide/frontend/building/).
:::

## Backend API

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` (image build) | Backend API base, including version prefix. Leave empty/relative for same-origin requests (the combined image). The local-dev `.env.example` points it at `http://localhost:8080/api/v1`, targeting `make backend-run-dev`. |

## Release stamps

Build-time only, set by the release pipeline (build args in
`backend/Dockerfile`); shown in the UI for support/debugging.

| Variable | Default | Notes |
|---|---|---|
| `VITE_RELEASE_SHA` | `dev` | Commit SHA of the build. `release.yml` passes `github.sha`. |
| `VITE_RELEASE_DATE` | `unknown` | Build date stamp. |

## Branding / site links

All optional, with neutral defaults. In production these come from the backend's
`frontend.*` config via `/config.js`; the `VITE_*` forms apply in local dev.

| Variable | Notes |
|---|---|
| `VITE_SITE_NAME` | Product / brand display name. |
| `VITE_SITE_LEGAL_NAME` | Legal entity name in copyright notices (defaults to `VITE_SITE_NAME`). |
| `VITE_SITE_URL` | Public marketing / home site URL. |
| `VITE_TERMS_URL` | Terms & Conditions page (defaults to `<VITE_SITE_URL>/terms-and-conditions`). |
| `VITE_PRIVACY_URL` | Privacy Policy page (defaults to `<VITE_SITE_URL>/privacy-policy`). |
| `VITE_SUPPORT_EMAIL` | Support contact email. |
| `VITE_BRAND_LOGO_URL` | Absolute URL to the brand logo (OpenGraph image on shared pages). |

## MCP

| Variable | Notes |
|---|---|
| `VITE_MCP_ENDPOINT` | The MCP endpoint advertised in client-setup snippets, e.g. `https://<your-mcp-host>/mcp/v1/common`. Runtime-injectable via `frontend.mcp_endpoint`. |

## Error reporting / problem details

| Variable | Notes |
|---|---|
| `VITE_ERROR_TYPE_BASE_URI` | Base URI for building RFC 9457 problem-detail `type` fields client-side (e.g. `<base>/errors/UNKNOWN`). Empty falls back to `about:blank`. |

## Analytics (Google Tag Manager / GA4)

Disabled by default — must be explicitly enabled. Runtime-injectable via the
backend's `frontend.gtm_*` / `frontend.ga4_measurement_id` config.

| Variable | Default | Notes |
|---|---|---|
| `VITE_GTM_ENABLED` | `false` | Set to `true` to enable GTM. |
| `VITE_GTM_ID` | — | GTM container ID (e.g. `GTM-XXXXXXX`). Empty disables GTM. |
| `VITE_GA4_MEASUREMENT_ID` | — | GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) for client-ID capture. |

## Firebase Cloud Messaging (web push)

Browser push notifications are **disabled unless all** of these are set. The
on-demand `firebase-messaging-sw.js` service worker is only registered when
Firebase is fully configured — there is no precaching service worker.

| Variable |
|---|
| `VITE_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `VITE_FIREBASE_APP_ID` |
| `VITE_FIREBASE_VAPID_KEY` |

:::note
These are **build-time only** (the service-worker config is generated during
`npm run build`), and the published image does not set them — web push is
disabled in the stock image. To enable it, build your own image with the
`VITE_FIREBASE_*` values present at build time.
:::

## Related

- [Frontend Overview](/developer-guide/frontend/overview/)
- [Building & Serving](/developer-guide/frontend/building/)
- [Backend Configuration](/developer-guide/backend/configuration/)
