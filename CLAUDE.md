# CLAUDE.md

Guidance for working in this repository.

## What this is

The VibeXP documentation site — a static [Astro](https://astro.build/) +
[Starlight](https://starlight.astro.build/) site, deployed to GitHub Pages at
`docs.vibexp.io`. Open source under AGPL-3.0-or-later.

## Commands

```bash
npm install      # install deps (resolves @vibexp/design-system from public npm)
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # preview the production build
npm run lint     # ESLint
npm run typecheck# astro check
npm run test     # Vitest
```

CI (`.github/workflows/ci.yml`) runs build + lint + typecheck + test on every PR
and push to main. `publish.yml` builds and deploys to GitHub Pages on push to
main.

## Content structure

Docs live in `src/content/docs/` (Starlight content collection). Content is
split into two top-level guides so each can grow independently:

- **`user-guide/`** — end-user docs. All current content lives here and is
  served under `/user-guide/...`.
- **`developer-guide/`** — contributor/developer docs (not written yet).

The homepage `index.mdx` and `404.md` stay at the collection root.

**Important:** every doc URL is `/user-guide/...`. When adding pages, register
their slug in the `sidebar` in `astro.config.mjs`, and use root-absolute
`/user-guide/...` links between docs (the site is served from a custom domain at
root, so no base prefix). When adding the developer guide later, add a sibling
`developer-guide/` group to the sidebar and homepage cards.

## Configuration

- `astro.config.mjs` — Starlight config, sidebar, integrations (sitemap,
  optional Sentry), Expressive Code, component overrides.
- Brand links, analytics (GTM), Sentry, and the site origin are all env-driven
  (`PUBLIC_*` / `SENTRY_*`) — see `.env.example`. Left unset, the site builds
  with neutral `example.com` placeholders; nothing tracks by default.
- `src/components/` — Starlight component overrides (Header, Footer, SiteTitle,
  Head, theme).
- `public/CNAME` — GitHub Pages custom domain (`docs.vibexp.io`).
- `public/_redirects` — Cloudflare Pages redirects (NOT used by GitHub Pages;
  kept for portability).

## Conventions

- Pin GitHub Actions to commit SHAs (with a `# vX.Y.Z` comment), not tags.
- Internal doc links are root-absolute under `/user-guide/...`.
- Run `npm run lint` and `npm run typecheck` before committing.
