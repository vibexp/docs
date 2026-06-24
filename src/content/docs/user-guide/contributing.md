---
title: Contributing
description: Set up a local VibeXP development environment and learn the conventions for contributing to the open-source project.
---

Thanks for your interest in contributing! VibeXP is an open-source AI workspace (prompts, artifacts, memories, teams, MCP). This page covers how to get a local development environment running. For the full, always-current details, see the repository's [`CONTRIBUTING.md`](https://github.com/vibexp/vibexp/blob/main/CONTRIBUTING.md).

For deeper architecture, configuration, and code-generation details, see the [Developer Guide](/developer-guide/intro/).

## Prerequisites

- **Node.js** >= 20 (for the JS/TS workspaces)
- **Go** 1.25 (see `backend/go.mod` for the exact version) for the backend
- **Docker** + Docker Compose (for the database and the self-host stack)
- Optionally **Bun** for the CLI

## Clone and install

The `vibexp/vibexp` repository holds the two deployable components: `backend/` (Go API) and `frontend/` (React + Vite SPA). The frontend's shared `@vibexp/*` packages (`@vibexp/api-client`, `@vibexp/design-system`) are published to **public npm**, so installing needs **no auth token**.

```bash
git clone https://github.com/vibexp/vibexp.git
cd vibexp

# Install the frontend dependencies. No NODE_AUTH_TOKEN or private registry needed.
make frontend-install
```

:::note
If `npm install` ever asks for credentials, something is misconfigured — there are no private dependencies. The `@vibexp/*` packages resolve from public npm.
:::

## Run the dev servers

The most common dev loop runs the backend and frontend with hot reload, driven through the root `Makefile`:

```bash
make backend-run-dev    # Go API with live reload
make frontend-run-dev   # React + Vite dev server
```

Run `make help` (or open the `Makefile`) to see all available targets, including:

```bash
make backend-build              # compile the backend
make backend-test               # run backend tests
make backend-lint               # golangci-lint
make backend-validate-openapi   # validate the OpenAPI spec
```

For the JS/TS workspaces:

```bash
# Build / lint / type-check a single workspace
npm run build --workspace=frontend
npm run lint --workspace=frontend
npm run typecheck --workspace=frontend
```

## Run the whole stack

For an end-to-end local environment, use the root compose file (published images + Postgres):

```bash
docker compose up -d
```

See [Self-Hosting](/user-guide/self-hosting/) for the full environment-variable matrix and prerequisites.

## Pull requests

1. Fork the repo and create a topic branch off `main`.
2. Keep your change focused. Add or update tests where it makes sense.
3. Run the relevant lint / test / build commands locally before pushing.
4. Open a PR using the template — fill in **What** / **Why** and link any related issue with `Closes #123` (or `Part of #123` for partial work).

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles:

```text
feat(frontend): add team switcher to the sidebar
fix(backend): return 404 instead of 500 for missing artifacts
docs(docs-site): document the MCP setup flow
chore(cli): bump dependencies
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`.

### GitHub Actions — SHA-pin requirement

All external actions referenced in workflow files (`uses:`) **must** be pinned to a full 40-character commit SHA, with the human-readable tag in a trailing comment. Mutable tag references (`@v4`, `@main`, …) are not allowed.

```yaml
# correct
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd  # v6.0.2

# rejected
- uses: actions/checkout@v6
```

Internal reusable workflows referenced by path (`uses: ./.github/...`) are exempt.

## Licensing

VibeXP is open-core. When you add files, follow the license of the directory they live in — see [Open Source → License model](/user-guide/open-source/#license-model-open-core).

## Security

Please do **not** report security vulnerabilities through public GitHub issues. See the repository's [`SECURITY.md`](https://github.com/vibexp/vibexp/blob/main/SECURITY.md) for the private disclosure process.

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold it — see the repository's [`CODE_OF_CONDUCT.md`](https://github.com/vibexp/vibexp/blob/main/CODE_OF_CONDUCT.md).
