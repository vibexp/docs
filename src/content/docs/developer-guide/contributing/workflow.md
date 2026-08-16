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

## Documentation changes go to vibexp/docs

The core repo has **no `docs/` directory**; a pre-commit hook rejects one.
User- and contributor-facing documentation lives in the
[vibexp/docs](https://github.com/vibexp/docs) repo (published at
docs.vibexp.io), so a docs change means a PR there, and docs track the latest
published release rather than `main`. The only documentation kept here is
code-adjacent: package-level `README.md` files next to the code they
describe, plus the root `README.md` and `CLAUDE.md`.

## Releases and backports

**Always target `main`, including urgent bug fixes.** You never need to open a
PR against a release branch. If a fix is needed in a patch release, a maintainer
cherry-picks it after it lands on `main`.

### How releases are cut

| Release | Cut from | Contains |
| --- | --- | --- |
| Minor (`0.10.0` to `0.11.0`) | `main` | everything merged since the last tag |
| Patch (`0.11.0` to `0.11.1`) | `release/0.11.x` | cherry-picks only |

A `release/X.Y.x` branch is created from the release tag the first time that
line needs a patch, then reused for later patches on the same line. Only the
newest minor line receives patches.

### Why fixes go to `main` first

A fix that lives only on a release branch is a fix the next minor silently
reintroduces. Landing on `main` first makes that impossible: the release branch
is the disposable copy, and `main` is where the fix has to survive.

Maintainers verify this with `git cherry main release/0.11.x`, which must print
no `+` lines.

### What a patch release may contain

A patch contains bug fixes and security fixes only. It may **not** change:

- `backend/openapi.yaml` (or `paths/`, `schemas/`). Both API clients publish
  automatically from `main` merges, so a spec change on a release branch
  produces a client matching no released image.
- `backend/migrations/`. Migrations are identified by their numeric prefix
  alone, so a separately numbered migration on a release branch permanently
  forks the schema lineage. Upgrading `0.11.0` to `0.11.1` to `0.12.0` must
  reach the same schema state as `0.11.0` straight to `0.12.0`.

If a fix requires either, it ships as a minor release instead. This is exactly
why the `013_consolidated` squash shipped as a minor: a renumbering rewrites
`main`'s migration filenames on purpose, and the collision gate rejects that
without the `migration-renumbering` label.

### Backporting (maintainers)

```bash
# 1. The fix is already merged to main.
# 2. Create the line branch, first patch on this line only.
git switch -c release/0.11.x v0.11.0
git push -u origin release/0.11.x

# 3. One cherry-pick per PR, based on the release branch.
git switch -c patch/123-fix-something release/0.11.x
git cherry-pick -x <sha-from-main>
```

`-x` records the source commit, which is what makes the two lines auditable
later. Never merge a release branch into `main`: cherry-pick individual commits
instead.

## Licensing

VibeXP is open-core under **AGPL-3.0-or-later**. When you add files, follow the
license of the directory they live in.

## Security disclosures

Please do **not** report security vulnerabilities through public GitHub issues.
Use GitHub's private reporting on the
[vibexp/vibexp repository](https://github.com/vibexp/vibexp) (Security tab,
"Report a vulnerability"), or contact the maintainers privately, rather than
opening a public issue or pull request.

## Code of Conduct

This project adheres to the
[Contributor Covenant](https://www.contributor-covenant.org/), and by
participating you are expected to uphold it. Be respectful in issues, pull
requests and reviews.
