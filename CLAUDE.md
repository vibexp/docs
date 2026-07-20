# CLAUDE.md

Guidance for working in this repository.

## What this is

The VibeXP documentation site — a static [Astro](https://astro.build/) +
[Starlight](https://starlight.astro.build/) site, deployed to GitHub Pages at
`docs.vibexp.io`. Open source under AGPL-3.0-or-later.

## Upstream projects

This site documents two products. Local checkouts are expected as sibling
directories of this repo (`$HOME/Projects/docs`):

| Product | Repository | Sibling checkout | Docs surface |
| --- | --- | --- | --- |
| VibeXP core | [vibexp/vibexp](https://github.com/vibexp/vibexp) | `../vibexp` | the whole site except `user-guide/cli/` |
| VibeXP CLI | [vibexp/cli](https://github.com/vibexp/cli) | `../cli` | `user-guide/cli/` |

If a checkout is missing, clone it first:

```bash
git clone https://github.com/vibexp/vibexp.git ../vibexp
git clone https://github.com/vibexp/cli.git ../cli
```

**Docs track the latest published release of each product, not its `main`
branch.** `main` may contain unreleased work, and docs must never describe
features that users cannot run yet. Before writing or validating docs, check
out the latest release tag in the relevant checkout:

```bash
cd ../vibexp   # or ../cli
git fetch --tags
git checkout "$(gh release view --repo vibexp/vibexp --json tagName -q .tagName)"
# for the CLI: gh release view --repo vibexp/cli --json tagName -q .tagName
```

Rules:

- Every documentation change must be validated and verified against the
  owning product's source at its latest release tag (features, commands,
  configuration, API surface, UI flows).
- Proactively keep the docs up to date: when a new release of either product
  is published, review the docs against it and update anything stale or
  missing.

### The `/update-docs` skill

The whole sync runs end to end via the **`update-docs`** skill
(`.claude/skills/update-docs/SKILL.md`). It takes an optional scope argument,
`core`, `cli`, or `both` (default `both`): detect each product's latest
release, audit the in-scope docs against the release source with file:line
evidence, fix/add/remove content, validate the build, open a PR, and run the
automated review loop until approved. Use it whenever the docs need to catch
up with a release. The last synced releases are recorded at the repo root in
`.vibexp-release` (core) and `.vibexp-cli-release` (cli); keep those files
updated in every sync PR.

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
split into two top-level guides, one per audience:

- **`user-guide/`** — for end users: how to use the VibeXP platform. Served
  under `/user-guide/...`. This includes the VibeXP CLI (`user-guide/cli/`),
  since the CLI is how end users drive the platform from a terminal.
- **`developer-guide/`** — for application developers: how to develop, deploy,
  and manage the application. Served under `/developer-guide/...`.

Keep content in the guide that matches its audience. Usage and features belong
in the user guide; architecture, configuration, and operations belong in the
developer guide.

The homepage `index.mdx` and `404.md` stay at the collection root.

**Important:** when adding pages, register their slug in the `sidebar` in
`astro.config.mjs`, and use root-absolute `/user-guide/...` or
`/developer-guide/...` links between docs (the site is served from a custom
domain at root, so no base prefix).

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

## Writing style

- No em dashes anywhere in documentation content.
- Be concise, short, and to the point. Cut anything that does not help the
  reader accomplish their task.
- Docs must be readable, easily scannable, and understandable by everyone:
  short paragraphs, clear headings, lists and tables over long prose.

## Conventions

- Pin GitHub Actions to commit SHAs (with a `# vX.Y.Z` comment), not tags.
- Internal doc links are root-absolute under `/user-guide/...` or
  `/developer-guide/...`.
- Run `npm run lint` and `npm run typecheck` before committing.
