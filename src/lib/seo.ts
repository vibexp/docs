// Pure, runtime-agnostic SEO helpers for the documentation site. Starlight
// already emits per-page `<title>`, `<meta name=description>`, the canonical
// `<link>`, and the default Open Graph tags from frontmatter + `site`. These
// helpers cover the gaps Starlight leaves: the global social-card image and the
// site-wide JSON-LD graph, both injected via the `head` config in
// `astro.config.mjs`. Mirrors the blog's `seo.ts` (escaping + Organization
// node) so both properties stay structurally identical.

import { SITE_URL } from './site.ts'

/**
 * Site-wide SEO constants. `origin` mirrors `site` in `astro.config.mjs`.
 * `ogImage` is the branded 1200×630 social card served from `public/`.
 */
export const SITE = {
  origin: SITE_URL,
  name: 'VibeXP Documentation',
  ogImage: '/og-banner.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  organization: {
    name: 'VibeXP',
    // Marketing/organization origin. Read from `PUBLIC_ORG_URL` with a neutral
    // placeholder default so the JSON-LD publisher node carries no real domain
    // unless configured. `process.env` fallback so the value also resolves when
    // this module is imported by `astro.config.mjs` (plain Node — no Vite env on
    // `import.meta.env`); see the note in `site.ts`.
    url:
      import.meta.env.PUBLIC_ORG_URL ||
      (typeof process !== 'undefined'
        ? process.env.PUBLIC_ORG_URL
        : undefined) ||
      'https://example.com',
    logo: '/logo.svg',
  },
} as const

/** Resolves a relative or absolute path to an absolute URL against an origin. */
export function toAbsoluteUrl(path: string, origin: string): string {
  return new URL(path, origin).href
}

/** A schema.org node without the top-level `@context` (added by `buildJsonLd`). */
export type SchemaObject = Record<string, unknown>

// U+2028/U+2029 are valid in JSON strings but break inline `<script>` because
// JS treats them as line terminators. Built from char codes so no invisible
// separator ever lives in source.
const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

const JSON_LD_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  [LINE_SEPARATOR]: '\\u2028',
  [PARAGRAPH_SEPARATOR]: '\\u2029',
}

const JSON_LD_UNSAFE = new RegExp(
  `[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`,
  'g'
)

/**
 * Serializes a value to JSON and escapes the characters that would let it break
 * out of an inline `<script>` element (`<`, `>`, `&`) or terminate a JS string
 * (U+2028/U+2029). The result is safe to emit verbatim inside
 * `<script type="application/ld+json">`.
 */
export function escapeJsonLd(value: unknown): string {
  // JSON.stringify returns `undefined` (not a string) for undefined, functions,
  // and symbols; emit valid empty JSON rather than throwing in `.replace`.
  const json = JSON.stringify(value) ?? 'null'
  return json.replace(JSON_LD_UNSAFE, char => JSON_LD_ESCAPES[char])
}

/** Builds the site-wide publisher `Organization` node. */
export function buildOrganization(origin: string): SchemaObject {
  return {
    '@type': 'Organization',
    name: SITE.organization.name,
    url: SITE.organization.url,
    logo: toAbsoluteUrl(SITE.organization.logo, origin),
  }
}

/** Builds the site-wide `WebSite` node for the documentation site. */
export function buildWebSite(origin: string): SchemaObject {
  return {
    '@type': 'WebSite',
    name: SITE.name,
    url: origin,
  }
}

/**
 * Builds the escaped `<script type="application/ld+json">` body carrying the
 * site-wide `Organization` + `WebSite` nodes as a single `@graph`. Returned as
 * an escaped JSON string ready to inline in the Starlight `head` config.
 */
export function buildJsonLd(origin: string = SITE.origin): string {
  const graph: SchemaObject[] = [
    buildOrganization(origin),
    buildWebSite(origin),
  ]
  return escapeJsonLd({ '@context': 'https://schema.org', '@graph': graph })
}
