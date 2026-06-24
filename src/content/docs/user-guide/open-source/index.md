---
title: Open Source
description: VibeXP is open source. Learn about its open-core license model, the monorepo layout, and how to get involved.
---

VibeXP is an open-source, AI-native workspace for prompts, artifacts, memories, and blueprints — with semantic search, an activity feed, team workspaces, and a built-in [MCP](https://modelcontextprotocol.io) server so AI agents can read and write your knowledge directly.

The full source lives on GitHub at **[vibexp/vibexp](https://github.com/vibexp/vibexp)**. Clone it, run it locally, and [self-host](/user-guide/self-hosting/) your own instance on your own domain.

:::note[No paid tiers]
This repository is open-sourced from the production codebase. Billing and subscription code has been removed — **all features are available with no paid tiers**. Any references to "Free / Pro / Enterprise" tiers in older documentation are deployment-defined limits, not VibeXP product tiers.
:::

## License model (open-core)

VibeXP uses an open-core license split. The **application core is AGPL-3.0-or-later**, and the **reusable integration tooling is MIT**:

| Component | Repository | License |
| --- | --- | --- |
| Core REST + MCP API (`backend/`) | `vibexp/vibexp` | AGPL-3.0-or-later |
| Web application (`frontend/`) | `vibexp/vibexp` | AGPL-3.0-or-later |
| Marketing site | `vibexp/website` | AGPL-3.0-or-later |
| Content blog | `vibexp/blog` | AGPL-3.0-or-later |
| Documentation site | `vibexp/docs` | AGPL-3.0-or-later |
| Command-line client | `vibexp/cli` | MIT |
| Generated TS API client (`@vibexp/api-client`) | `vibexp/api-client-js` | MIT |
| Design tokens + brand (`@vibexp/design-system`) | separate package | MIT |

When you add files, follow the license of the repository they live in.

## Repository layout

VibeXP is split across several repositories under [`github.com/vibexp`](https://github.com/vibexp). The main `vibexp/vibexp` repo holds the two independently deployable components — the Go backend and the React frontend. The frontend's shared `@vibexp/*` packages are published to **public npm**, so a fresh install needs **no auth token**.

| Path / Repo | What it is | Stack |
| --- | --- | --- |
| `backend/` (in `vibexp/vibexp`) | Core REST + MCP API | Go, PostgreSQL + pgvector |
| `frontend/` (in `vibexp/vibexp`) | Web application | React + Vite |
| `vibexp/cli` | Command-line client | TypeScript + Bun |
| `vibexp/api-client-js` | Generated TS API client (`@vibexp/api-client`) | TypeScript |
| `vibexp/website` | Marketing site | Astro + React |
| `vibexp/blog` | Content blog | Astro |
| `vibexp/docs` | User & developer documentation | Astro Starlight |

## Where to file issues

- **Bugs and feature requests**: open an issue at [github.com/vibexp/vibexp/issues](https://github.com/vibexp/vibexp/issues).
- **Security vulnerabilities**: do **not** use public issues. Follow the private disclosure process in the repository's [`SECURITY.md`](https://github.com/vibexp/vibexp/blob/main/SECURITY.md).
- **Questions and contributions**: see the [Contributing](/user-guide/contributing/) guide.

## Branding

The "VibeXP" name and logo are brand assets of the project maintainer. If you run a fork, use your own name and branding — the site/email branding and all domains are overridable via environment variables. See [Self-Hosting → Branding](/user-guide/self-hosting/#branding).

## Next steps

- [Self-Hosting](/user-guide/self-hosting/) — run your own instance with Docker Compose.
- [Contributing](/user-guide/contributing/) — set up a development environment and open a PR.
