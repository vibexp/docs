# VibeXP Documentation

[![CI](https://github.com/vibexp/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/vibexp/docs/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

The documentation site for [VibeXP](https://github.com/vibexp/vibexp), the
open-source AI workspace. Built with [Astro](https://astro.build/) and
[Starlight](https://starlight.astro.build/), deployed to GitHub Pages at
**[docs.vibexp.io](https://docs.vibexp.io)**.

## Content structure

Documentation lives in `src/content/docs/` (Markdown / MDX), split into two
guides, one per audience:

- **[`user-guide/`](./src/content/docs/user-guide/)**: for end users, how to
  use the VibeXP platform (prompts, artifacts, memory, agents, MCP,
  self-hosting). Served under `/user-guide/...`.
- **[`developer-guide/`](./src/content/docs/developer-guide/)**: for
  application developers, how to develop, deploy, and operate VibeXP
  (backend, frontend, deployment, contributing). Served under
  `/developer-guide/...`.

The homepage (`index.mdx`) links into both guides. The sidebar and
integrations are configured in `astro.config.mjs`; Starlight component
overrides (header, footer, site title) live in `src/components/`.

## Development

```bash
npm install
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | Type-check via `astro check` |
| `npm run test` / `test:coverage` | Vitest |

Site URL, analytics, error tracking, and brand links are all configured via
environment variables; see [`.env.example`](./.env.example). Left unset, the
site builds with neutral `example.com` placeholders and nothing tracks by
default.

## Keeping docs in sync with VibeXP

The docs track the **latest published release** of
[vibexp/vibexp](https://github.com/vibexp/vibexp), never its `main` branch.
The last synced release is recorded in [`.vibexp-release`](./.vibexp-release).

Content changes are validated against the VibeXP source at that release tag.
For contributors using [Claude Code](https://claude.com/product/claude-code),
the repository ships an `update-docs` skill
([`.claude/skills/update-docs/`](./.claude/skills/update-docs/SKILL.md)) that
runs the whole sync end to end: detect the newest release, audit every page
against the release source, fix and extend the docs, validate the build, and
open a reviewed pull request.

## Deployment

Pushes to `main` trigger `.github/workflows/publish.yml`, which builds the
site and deploys it to GitHub Pages under the custom domain
`docs.vibexp.io` (`public/CNAME`). CI (`ci.yml`) runs build, lint,
typecheck, and tests on every PR.

## Contributing

Issues and pull requests are welcome. Please:

1. Keep content factual: every claim must match the VibeXP source at the
   release recorded in `.vibexp-release`.
2. Follow the writing style: no em dashes, concise, scannable.
3. Register new pages in the `sidebar` in `astro.config.mjs` and use
   root-absolute `/user-guide/...` or `/developer-guide/...` links.
4. Run `npm run lint` and `npm run typecheck` before committing.

See [CLAUDE.md](./CLAUDE.md) for the full conventions.

## License

[AGPL-3.0-or-later](./LICENSE)
