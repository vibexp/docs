import { defineConfig } from 'astro/config'
import sentry from '@sentry/astro'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

import { SITE_URL } from './src/lib/site.ts'
import { SITE, buildJsonLd, toAbsoluteUrl } from './src/lib/seo.ts'

const ogImageUrl = toAbsoluteUrl(SITE.ogImage, SITE_URL)

// Sentry source-map upload is org/project-scoped. Both the org and project
// slugs are env-driven (SENTRY_ORG / SENTRY_PROJECT) so the public repo carries
// no real org identifiers. The integration is included only when both are set
// AND an auth token is present; otherwise it is omitted entirely so
// `npm run build` works out of the box without any Sentry config.
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const sentryIntegration =
  sentryOrg && sentryProject && process.env.SENTRY_AUTH_TOKEN
    ? [
        // Client-side error tracking (#1570). The DSN comes from
        // PUBLIC_SENTRY_DSN at build time and init is gated on its presence in
        // sentry.client.config.js. The Sentry Vite plugin reads the auth token
        // from SENTRY_AUTH_TOKEN and uploads source maps, then deletes the
        // generated .map files after upload — the SDK's auto-delete glob only
        // matches client/server adapter output, not a static build's
        // dist/_astro/*.map, so without this the maps would be deployed
        // publicly. Uses the non-deprecated top-level org/project options
        // (sourceMapsUploadOptions is deprecated in @sentry/astro v10).
        sentry({
          org: sentryOrg,
          project: sentryProject,
          sourcemaps: {
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
        }),
      ]
    : []

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    ...sentryIntegration,
    starlight({
      title: 'VibeXP Documentation',
      customCss: ['./src/styles/global.css'],
      // Starlight wires the SVG favicon itself. The `head` entries below add the
      // brand fallbacks Starlight omits (apple-touch-icon, web manifest, .ico
      // fallback), the global social-card image + Twitter tags (Starlight emits
      // og:title/description/type/url but never an image), and the site-wide
      // Organization + WebSite JSON-LD graph. Per-page <title>/description and
      // the canonical <link> already come from frontmatter + `site` — not
      // repeated here. Mirrors blog/src/components/BaseHead.astro.
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
        { tag: 'meta', attrs: { property: 'og:image', content: ogImageUrl } },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:width',
            content: String(SITE.ogImageWidth),
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:height',
            content: String(SITE.ogImageHeight),
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:site_name', content: SITE.name },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        { tag: 'meta', attrs: { name: 'twitter:image', content: ogImageUrl } },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: buildJsonLd(SITE_URL),
        },
      ],
      // Explicit sidebar order. Listing slugs explicitly (rather than
      // autogenerate) keeps the homepage out of the nav and pins the
      // Prompts / Integrations categories open. Entry labels default to each
      // page's frontmatter title.
      //
      // Everything lives under a top-level "User Guide" group (URLs are
      // `/user-guide/...`) so a sibling "Developer Guide" group can be added
      // later without disturbing these slugs.
      sidebar: [
        {
          label: 'User Guide',
          items: [
            { slug: 'user-guide/intro' },
            { slug: 'user-guide/quick-start' },
            {
              label: 'Prompts',
              collapsed: false,
              items: [
                { slug: 'user-guide/prompts' },
                { slug: 'user-guide/prompts/getting-started' },
                { slug: 'user-guide/prompts/managing-prompts' },
                { slug: 'user-guide/prompts/advanced-features' },
                { slug: 'user-guide/prompts/best-practices' },
                { slug: 'user-guide/prompts/api-integration' },
                { slug: 'user-guide/prompts/faq' },
              ],
            },
            { slug: 'user-guide/artifacts' },
            { slug: 'user-guide/memory' },
            { slug: 'user-guide/blueprints' },
            { slug: 'user-guide/mcp-server' },
            { slug: 'user-guide/ai-agents' },
            { slug: 'user-guide/feeds' },
            { slug: 'user-guide/resource-access-analytics' },
            {
              label: 'Integrations',
              collapsed: false,
              items: [
                { slug: 'user-guide/integrations/api-keys' },
                { slug: 'user-guide/integrations/ai-providers' },
              ],
            },
            {
              label: 'Open Source & Self-Hosting',
              collapsed: false,
              items: [
                { slug: 'user-guide/open-source' },
                { slug: 'user-guide/self-hosting' },
                { slug: 'user-guide/self-hosting/authentication' },
                { slug: 'user-guide/contributing' },
              ],
            },
          ],
        },
        {
          label: 'Developer Guide',
          items: [
            { slug: 'developer-guide/intro' },
            { slug: 'developer-guide/getting-started' },
            {
              label: 'Backend',
              collapsed: false,
              items: [
                { slug: 'developer-guide/backend/overview' },
                { slug: 'developer-guide/backend/configuration' },
                { slug: 'developer-guide/backend/database' },
                { slug: 'developer-guide/backend/authentication' },
                { slug: 'developer-guide/backend/mcp-server' },
                { slug: 'developer-guide/backend/api-and-openapi' },
                { slug: 'developer-guide/backend/code-generation' },
                { slug: 'developer-guide/backend/testing' },
              ],
            },
            {
              label: 'Frontend',
              collapsed: false,
              items: [
                { slug: 'developer-guide/frontend/overview' },
                { slug: 'developer-guide/frontend/configuration' },
                { slug: 'developer-guide/frontend/building' },
              ],
            },
            {
              label: 'Deployment',
              collapsed: false,
              items: [
                { slug: 'developer-guide/deployment/self-hosting' },
                { slug: 'developer-guide/deployment/docker' },
                { slug: 'developer-guide/deployment/configuration-reference' },
              ],
            },
            {
              label: 'Contributing',
              collapsed: false,
              items: [
                { slug: 'developer-guide/contributing/workflow' },
                { slug: 'developer-guide/contributing/pre-commit-and-ci' },
                { slug: 'developer-guide/contributing/code-conventions' },
              ],
            },
          ],
        },
      ],
      // Brand chrome overrides (#1519). SiteTitle = logo + wordmark; Header adds
      // the branded top-nav while re-using Starlight's Search + ThemeSelect;
      // MobileMenuFooter surfaces that nav inside Starlight's mobile menu; Footer
      // keeps Starlight's Pagination then appends the 4-column brand footer.
      components: {
        // Head composes Starlight's default head (preserving #1523 SEO/OG/
        // JSON-LD) then appends the GTM + Consent Mode v2 flow and the site-wide
        // cookie banner (#1548).
        Head: './src/components/Head.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Header: './src/components/Header.astro',
        // Bridges the design-system `.dark`-class dark mode onto Starlight's
        // `data-theme` attribute toggle (#1649): sets `data-theme` exactly as
        // upstream, then mirrors it to a `.dark` class (pre-paint inline +
        // MutationObserver) so @vibexp/design-system tokens flip.
        ThemeProvider: './src/components/ThemeProvider.astro',
        // Icon-only theme toggle that cycles light → dark → auto on click,
        // replacing Starlight's dropdown for parity with the blog (#1394).
        ThemeSelect: './src/components/ThemeSelect.astro',
        MobileMenuFooter: './src/components/MobileMenuFooter.astro',
        Footer: './src/components/Footer.astro',
      },
      // Starlight ships Expressive Code (build-time Shiki) for fenced-code
      // highlighting. Each token carries both palettes as inline CSS variables
      // and the active one is selected purely on Starlight's `data-theme`
      // attribute — no highlighter JS ships and toggling the theme never
      // re-highlights (parity with the blog's rehype-pretty-code setup). The
      // copy button, frame titles, and line highlighting are all on by default
      // via @expressive-code/plugin-frames.
      expressiveCode: {
        themes: ['github-light', 'github-dark'],
        // Keep the theme's own code background/foreground (the structural fix
        // for Bug A) but bring the frame chrome onto the brand tokens so blocks
        // match the docs shell instead of GitHub's square, hard-bordered frame.
        styleOverrides: {
          borderRadius: 'var(--radius)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          frames: {
            shadowColor: 'transparent',
            editorTabBarBorderBottomColor: 'var(--border)',
          },
        },
      },
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
