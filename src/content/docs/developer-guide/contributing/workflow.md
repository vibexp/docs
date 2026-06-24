---
title: Contribution Workflow
description: How to branch, commit, and open a pull request for VibeXP — Conventional Commits, PR conventions, licensing, and security.
---

This is the developer-facing workflow for contributing to VibeXP. For a lighter,
end-user-oriented overview, see [Contributing](/user-guide/contributing/).

## Branch off `main`

Create a focused topic branch from `main`:

```bash
git switch -c feat/team-switcher main
```

Keep each PR focused on a single change. Smaller PRs are reviewed faster and are
easier to revert if something goes wrong. Add or update tests where it makes
sense.

:::note
Direct commits to `main` are blocked by a pre-commit hook
(`no-commit-to-branch`). Always work on a branch.
:::

## Conventional Commits

VibeXP uses [Conventional Commits](https://www.conventionalcommits.org/) for
commit messages and PR titles. Use a scope that names the affected component:

```text
feat(frontend): add team switcher to the sidebar
fix(backend): return 404 instead of 500 for missing artifacts
docs(backend): document the MCP setup flow
refactor(frontend): extract artifact diff viewer into a hook
chore(backend): bump pgvector to the latest patch
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`.
Common scopes: `backend`, `frontend` (plus narrower scopes where useful).

## Open a pull request

1. Run the relevant lint / test / build targets locally first (see below) so CI
   passes on the first try.
2. Push your branch and open a PR using the template.
3. Fill in **What** and **Why**, and link related issues with `Closes #123`
   (or `Part of #123` for partial work).
4. Wait for **CI to pass** — it runs the same `make` targets you ran locally.

### Run the checks locally first

```bash
# Backend
make backend-test
make backend-lint
make backend-check

# Frontend
make frontend-test
make frontend-lint
make frontend-type-check
make frontend-build
```

For the full picture of what runs on every commit and in CI, see
[Pre-commit & CI](/developer-guide/contributing/pre-commit-and-ci/).

## Licensing

VibeXP is open-core under **AGPL-3.0-or-later**. When you add files, follow the
license of the directory they live in.

## Security disclosures

Please do **not** report security vulnerabilities through public GitHub issues.
Follow the private disclosure process in the repository's
[`SECURITY.md`](https://github.com/vibexp/vibexp/blob/main/SECURITY.md).

## Code of Conduct

This project adheres to the
[Contributor Covenant](https://www.contributor-covenant.org/). By participating,
you are expected to uphold it — see the repository's
[`CODE_OF_CONDUCT.md`](https://github.com/vibexp/vibexp/blob/main/CODE_OF_CONDUCT.md).
