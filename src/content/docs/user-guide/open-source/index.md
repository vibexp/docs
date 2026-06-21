---
title: Open Source
description: VibeXP is open source. Learn about its open-core license model, the monorepo layout, and how to get involved.
---

VibeXP is an open-source, AI-native workspace for prompts, artifacts, memories, and blueprints — with semantic search, an activity feed, team workspaces, and a built-in [MCP](https://modelcontextprotocol.io) server so AI agents can read and write your knowledge directly.

The full source lives on GitHub at **[shaharia-lab/vibexp-oss](https://github.com/shaharia-lab/vibexp-oss)**. Clone it, run it locally, and [self-host](/user-guide/self-hosting/) your own instance on your own domain.

:::note[No paid tiers]
This repository is open-sourced from the production codebase. Billing and subscription code has been removed — **all features are available with no paid tiers**. Any references to "Free / Pro / Enterprise" tiers in older documentation are deployment-defined limits, not VibeXP product tiers.
:::

## License model (open-core)

VibeXP uses an open-core license split. The license a file falls under is determined by the directory it lives in:

| Component | Path | License |
| --- | --- | --- |
| Core REST + MCP API | `backend-api/` | AGPL-3.0-or-later |
| Web application | `frontend/` | AGPL-3.0-or-later |
| Marketing site | `website/` | AGPL-3.0-or-later |
| Content blog | `blog/` | AGPL-3.0-or-later |
| Documentation site | `docs-site/` | AGPL-3.0-or-later |
| Command-line client | `cli/` | MIT |
| Generated TS API client | `api-client/` | MIT |
| Design tokens + brand | `design-system/` | MIT |

In short: the **application core is AGPL-3.0-or-later**, and the **reusable integration tooling is MIT**. When you add files, follow the license of the directory they live in.

## Monorepo layout

VibeXP is a flat [npm-workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo (plus a Go service). A fresh `npm install` needs **no auth token** — the shared `@vibexp/*` packages are vendored in-repo and resolve locally.

| Path | What it is | Stack |
| --- | --- | --- |
| `backend-api/` | Core REST + MCP API | Go, PostgreSQL + pgvector |
| `frontend/` | Web application | React + Vite |
| `cli/` | Command-line client | TypeScript + Bun |
| `api-client/` | Generated TS API client (`@vibexp/api-client`) | TypeScript |
| `design-system/` | Shared design tokens + brand (`@vibexp/design-system`) | CSS + React |
| `website/` | Marketing site | Astro + React |
| `blog/` | Content blog | Astro |
| `docs-site/` | Documentation site | Astro Starlight |
| `docs/` | Developer & user docs | Markdown |

## Where to file issues

- **Bugs and feature requests**: open an issue at [github.com/shaharia-lab/vibexp-oss/issues](https://github.com/shaharia-lab/vibexp-oss/issues).
- **Security vulnerabilities**: do **not** use public issues. Follow the private disclosure process in the repository's [`SECURITY.md`](https://github.com/shaharia-lab/vibexp-oss/blob/main/SECURITY.md).
- **Questions and contributions**: see the [Contributing](/user-guide/contributing/) guide.

## Branding

The "VibeXP" name and logo are brand assets of the project maintainer. If you run a fork, use your own name and branding — the site/email branding and all domains are overridable via environment variables. See [Self-Hosting → Branding](/user-guide/self-hosting/#branding).

## Next steps

- [Self-Hosting](/user-guide/self-hosting/) — run your own instance with Docker Compose.
- [Contributing](/user-guide/contributing/) — set up a development environment and open a PR.
