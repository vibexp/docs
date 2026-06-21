/// <reference path="../.astro/types.d.ts" />

// Starlight declares the override-only virtual component modules
// (`virtual:starlight/components/*`) in its internal declaration file, which is
// not part of the project type graph by default. Referencing it lets our
// Header/Footer/MobileMenuFooter overrides re-import Starlight's built-ins
// (Search, ThemeSelect, Pagination, …) with full types. Runtime resolution is
// handled by Starlight's Vite plugin regardless.
/// <reference path="../node_modules/@astrojs/starlight/virtual-internal.d.ts" />

interface ImportMetaEnv {
  /**
   * Google Tag Manager container id (e.g. `GTM-XXXXXXX`). Public, non-secret;
   * `PUBLIC_`-prefixed so Astro exposes it to the client. When unset, GTM stays
   * disabled (no default container).
   */
  readonly PUBLIC_GTM_ID?: string

  /** Canonical production origin for the docs site (e.g. `https://docs.example.com`). */
  readonly PUBLIC_SITE_URL?: string

  /** Marketing/organization origin used in JSON-LD (e.g. `https://example.com`). */
  readonly PUBLIC_ORG_URL?: string

  /** Marketing website origin linked from the nav/footer. */
  readonly PUBLIC_WEBSITE_URL?: string

  /** Blog origin linked from the nav/footer. */
  readonly PUBLIC_BLOG_URL?: string

  /** Application origin (login link) used in the nav. */
  readonly PUBLIC_APP_URL?: string

  /** Organization GitHub URL linked from the header nav. */
  readonly PUBLIC_GITHUB_URL?: string

  /** Project GitHub repository URL linked from the footer. */
  readonly PUBLIC_GITHUB_REPO_URL?: string

  /** X (Twitter) profile URL linked from the footer. */
  readonly PUBLIC_TWITTER_URL?: string

  /** Privacy policy URL used by the cookie consent banner. */
  readonly PUBLIC_PRIVACY_POLICY_URL?: string

  /** Brand/attribution name shown in the footer copyright. */
  readonly PUBLIC_BRAND_NAME?: string

  /** Brand operator/attribution org name shown in the footer. */
  readonly PUBLIC_BRAND_OPERATOR?: string

  /** Brand operator URL linked from the footer attribution. */
  readonly PUBLIC_BRAND_OPERATOR_URL?: string

  /** Sentry org slug for source-map upload (build-time only). */
  readonly SENTRY_ORG?: string

  /** Sentry project slug for source-map upload (build-time only). */
  readonly SENTRY_PROJECT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
