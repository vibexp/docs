# CLAUDE.md

Guidance for working in this repository.

## What this is

The VibeXP documentation site — a static [Astro](https://astro.build/) +
[Starlight](https://starlight.astro.build/) site, deployed to GitHub Pages at
`docs.vibexp.io`. Open source under AGPL-3.0-or-later.

## Upstream projects

This site documents these products. Local checkouts are expected as sibling
directories of this repo (`$HOME/Projects/docs`):

| Product | Repository | Sibling checkout | Docs surface | Guide |
| --- | --- | --- | --- | --- |
| VibeXP core | [vibexp/vibexp](https://github.com/vibexp/vibexp) | `../vibexp` | the whole site except the surfaces below | user + developer |
| VibeXP CLI | [vibexp/cli](https://github.com/vibexp/cli) | `../cli` | `user-guide/cli/` | user |
| Design system | [vibexp/design-system](https://github.com/vibexp/design-system) | `../design-system` | design-system content in `developer-guide/frontend/` | developer |
| JS API client | [vibexp/api-client-js](https://github.com/vibexp/api-client-js) | `../api-client-js` | `developer-guide/api-clients/` | developer |
| Go API client | [vibexp/api-client-go](https://github.com/vibexp/api-client-go) | `../api-client-go` | `developer-guide/api-clients/` | developer |

The design system (`@vibexp/design-system` on npm) and the generated API
clients (`@vibexp/api-client` on npm, `github.com/vibexp/api-client-go` Go
module) are developer tools: document them only in the developer guide.

If a checkout is missing, clone it first:

```bash
git clone https://github.com/vibexp/<repo>.git ../<repo>
```

**Docs track the latest published release of each product, not its `main`
branch.** `main` may contain unreleased work, and docs must never describe
features that users cannot run yet. Before writing or validating docs, check
out the latest release tag in the relevant checkout:

```bash
cd ../<repo>
git fetch --tags
git checkout "$(gh release view --repo vibexp/<repo> --json tagName -q .tagName)"
```

The API clients publish no GitHub releases; they version through git tags
only (npm publish / Go module tags). For those, use the highest semver tag:
`git tag --sort=-v:refname | head -1`.

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
one or more of `core`, `cli`, `design-system`, `api-client-js`,
`api-client-go`, or `all` (default `all`): detect each product's latest
release, audit the in-scope docs against the release source with file:line
evidence, fix/add/remove content, validate the build, open a PR, and run the
automated review loop until approved. Use it whenever the docs need to catch
up with a release. The last synced release of each product is recorded in a
marker file at the repo root (`.vibexp-release` for core,
`.vibexp-<product>-release` for the rest; the skill's scope table lists them
all); keep those files updated in every sync PR.

## Related repositories (not documented here)

Sibling web properties of the project. They are not upstream products of
this site: never add doc pages about them or sync against their releases.

- [vibexp/website](https://github.com/vibexp/website) (`../website`): the
  marketing website at `vibexp.io`.
- [vibexp/blog](https://github.com/vibexp/blog) (`../blog`): the official
  blog at `blog.vibexp.io`.

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
