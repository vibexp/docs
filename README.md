# VibeXP Documentation

The VibeXP documentation site, built with [Astro](https://astro.build/) and
[Starlight](https://starlight.astro.build/). Builds to a static site suitable
for any static host (e.g. Cloudflare Pages).

Site URL, analytics, error tracking, and external/brand links are all
configured via environment variables — see [`.env.example`](./.env.example).
Left unset, the site builds with neutral `example.com` placeholders.

Documentation content lives in the `src/content/docs/` content collection
(Markdown / MDX). It is organized into two top-level guides so each can grow
independently:

- **`user-guide/`** — end-user documentation (all current content lives here,
  served under `/user-guide/...`).
- **`developer-guide/`** — contributor / developer documentation (to be added).

The homepage (`index.mdx`) stays at the site root and links into each guide.
Theming uses Tailwind v4 (via `@tailwindcss/vite`) with brand tokens in
`src/styles/global.css`; fenced code blocks are highlighted at build time by
Expressive Code (`github-light` / `github-dark`). Starlight component overrides
(header, footer, site title) live in `src/components/`, and the sidebar plus
integrations are configured in `astro.config.mjs`.

## Install

```bash
npm install
```

## Local development

```bash
npm run dev
```

## Build

```bash
npm run build
```

Generates the static site into the `dist/` directory.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with `--fix` |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | Type-check via `astro check` |
| `npm run test` | Run Vitest |
| `npm run test:coverage` | Run Vitest with coverage |
