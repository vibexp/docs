/**
 * Canonical production origin for the documentation site.
 *
 * Read from `PUBLIC_SITE_URL` at build time with a neutral placeholder default
 * so the site builds out of the box without any env config. Set
 * `PUBLIC_SITE_URL` (e.g. in `.env` or the deploy workflow) to the real origin.
 *
 * `import.meta.env` covers app/component code (Astro/Vite). `process.env` is the
 * fallback for when this module is imported by `astro.config.mjs` — that file
 * runs in plain Node, where Vite's loaded `.env`/`PUBLIC_*` vars are NOT on
 * `import.meta.env`, so without it the config-level `site` would stay the
 * placeholder regardless of the configured origin.
 */
export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_SITE_URL : undefined) ||
  'https://docs.example.com'
