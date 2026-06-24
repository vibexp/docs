---
title: Frontend Configuration
description: Reference for the VibeXP frontend's build-time VITE_* variables and the single nginx runtime variable, with sensible defaults for self-hosting.
---

The frontend is configured through environment variables. The canonical list and
defaults live in
[`frontend/.env.example`](https://github.com/vibexp/vibexp/blob/main/frontend/.env.example).

## Build-time vs runtime

This is the most important distinction:

- **`VITE_*` and `SENTRY_*` variables are inlined at _build_ time.** They are
  baked into the JavaScript bundle when `vite build` runs. Changing them requires
  rebuilding the image.
- **`BACKEND_ORIGIN` is the only _runtime_ variable.** It is read by nginx at
  container start (via `envsubst`) to decide where to proxy `/api/`. You can
  change it without rebuilding.

:::tip[Why the API base URL is relative]
The published image is built with `VITE_API_BASE_URL=/api/v1` so requests are
same-origin. The backend location is chosen at deploy time through
`BACKEND_ORIGIN`, keeping a single image deployment-agnostic. Do not hardcode a
backend origin into the build. See
[Building & Serving](/developer-guide/frontend/building/).
:::

## Backend API

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` (image build) | Backend API base, including version prefix. Leave relative for same-origin requests behind the nginx proxy. The local-dev `.env.example` points it at `http://localhost:8080/api/v1`. |
| `BACKEND_ORIGIN` | `http://backend:8080` | **Runtime.** nginx reverse-proxy target for `/api/`. Set per deployment. |

## Branding / site links

All optional, with neutral defaults.

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
| `VITE_MCP_ENDPOINT` | The MCP endpoint advertised in client-setup snippets, e.g. `https://<your-mcp-host>/mcp/v1/common`. |

## Error reporting / problem details

| Variable | Notes |
|---|---|
| `VITE_ERROR_TYPE_BASE_URI` | Base URI for building RFC 9457 problem-detail `type` fields client-side (e.g. `<base>/errors/UNKNOWN`). Empty falls back to `about:blank`. |

## Analytics (Google Tag Manager / GA4)

Disabled by default — must be explicitly enabled.

| Variable | Default | Notes |
|---|---|---|
| `VITE_GTM_ENABLED` | `false` | Set to `true` to enable GTM. |
| `VITE_GTM_ID` | — | GTM container ID (e.g. `GTM-XXXXXXX`). Empty disables GTM. |
| `VITE_GA4_MEASUREMENT_ID` | — | GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) for client-ID capture. |

## Sentry (error monitoring)

Optional.

| Variable | When | Notes |
|---|---|---|
| `VITE_SENTRY_DSN` | runtime DSN (build-inlined) | Empty disables Sentry. |
| `SENTRY_ORG` | build only | Source-map upload. |
| `SENTRY_PROJECT` | build only | Source-map upload. |
| `SENTRY_AUTH_TOKEN` | build only (CI) | Source-map upload. |

:::note
All three of `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` must be set
for source maps to be uploaded at build time. They are not `VITE_*` because they
are not inlined into the bundle. See
[Building & Serving](/developer-guide/frontend/building/) for the upload-then-delete flow.
:::

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

## Related

- [Frontend Overview](/developer-guide/frontend/overview/)
- [Building & Serving](/developer-guide/frontend/building/)
- [Backend Configuration](/developer-guide/backend/configuration/)
