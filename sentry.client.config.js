import * as Sentry from '@sentry/astro'

/**
 * Client-side Sentry init for the docs site (static Cloudflare Pages build —
 * no SSR, so there is no server/edge config). Auto-loaded by the
 * `@sentry/astro` integration (see `astro.config.mjs`) and injected into every
 * page.
 *
 * The DSN is read from `PUBLIC_SENTRY_DSN`, injected at build time by the
 * docs-site deploy workflow. It is deliberately given NO hardcoded fallback:
 * when the var is absent — local dev, `npm run build` without config, PR CI —
 * Sentry is left uninitialized so we never ship dev/test noise to the shared
 * org error quota. The DSN value itself is a public, client-side token by
 * design. Mirrors blog/sentry.client.config.js.
 */
const dsn = import.meta.env.PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.PROD ? 'production' : import.meta.env.MODE,

    // Errors only: no performance tracing and no session replay. Keeps the
    // shared free Sentry quota (5k errors/mo, org-wide) safe and the client
    // bundle small.
    tracesSampleRate: 0,

    // Drop benign/extension noise, mirroring the blog's and website's Sentry
    // filters.
    ignoreErrors: [
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      'ResizeObserver loop',
    ],
  })
}
