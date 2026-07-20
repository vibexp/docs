---
name: update-docs
description: Sync the documentation site with the latest published releases of VibeXP core (vibexp/vibexp) and/or the VibeXP CLI (vibexp/cli). Takes an optional scope argument, core, cli, or both (default both). Detects each release, audits the relevant doc pages against the release source with file:line evidence, fixes stale content, adds missing features, removes nonexistent ones, validates the site, opens a PR, and runs the automated review loop until approved. Use when asked to update the docs, sync docs with a release, or via /update-docs.
argument-hint: "[core|cli|both]"
---

# Update Docs: sync documentation with the latest releases

Sync this documentation site with the **latest published release** of one or
both upstream products, end to end: detect the release, audit every in-scope
doc page against the release source with evidence, fix stale content, add
missing features, remove content that does not exist, validate the site, open
a PR, run the automated review loop until it approves, then stop and wait for
human review.

## Scope argument

The skill takes one optional argument: `core`, `cli`, or `both`. No argument
means `both`.

| Scope | Repository | Sibling checkout | Release marker | Docs surface |
| --- | --- | --- | --- | --- |
| `core` | [vibexp/vibexp](https://github.com/vibexp/vibexp) | `../vibexp` | `.vibexp-release` | the whole site except `user-guide/cli/` |
| `cli` | [vibexp/cli](https://github.com/vibexp/cli) | `../cli` | `.vibexp-cli-release` | `src/content/docs/user-guide/cli/` |

CLI documentation lives in the **user guide** (`user-guide/cli/`): the CLI is
how end users drive the VibeXP platform from a terminal. Only content about
developing the CLI itself would belong in the developer guide.

With scope `both`, run every phase for each product. Products that are
already in sync are skipped individually; one PR carries all changes.

## Hard rules

- **Docs track the latest published release, never `main`.** This applies to
  both repositories. `main` may contain unreleased work that users cannot
  run. All validation happens against the release tag.
- **Every claim needs source evidence.** A doc statement survives only if the
  product source at its release tag proves it (file:line). Never document a
  feature you could not find in the source. Remove or fix claims the source
  contradicts.
- **Writing style** (from CLAUDE.md): no em dashes anywhere in documentation
  content, concise and to the point, readable and easily scannable.
- **Never merge the PR.** The flow ends with an approved, unmerged PR waiting
  for the human.

## Phase 0: Preconditions

1. Each in-scope product must exist at its sibling path (see the scope
   table; paths are relative to this repo's root, i.e.
   `$HOME/Projects/vibexp` and `$HOME/Projects/cli` when this repo is at
   `$HOME/Projects/docs`). If missing:
   ```bash
   git clone https://github.com/vibexp/vibexp.git ../vibexp
   git clone https://github.com/vibexp/cli.git ../cli
   ```
2. `gh` must be authenticated (`gh auth status`). If not, stop and ask the
   user to authenticate.

## Phase 1: Determine versions

For each in-scope product:

1. Latest published release:
   ```bash
   gh release view --repo vibexp/vibexp --json tagName -q .tagName   # core
   gh release view --repo vibexp/cli   --json tagName -q .tagName    # cli
   ```
2. Last synced release: read the product's marker file at this repo's root
   (`.vibexp-release` for core, `.vibexp-cli-release` for cli). If the file
   is missing, infer the last synced version from git history
   (`git log --oneline`, look for the most recent docs-sync commit for that
   product) and treat the marker as needing creation. A missing marker with
   no prior sync commits (the first CLI sync, for example) means the whole
   docs surface for that product is new: audit against everything in the
   release.
3. **If every in-scope product's latest release equals its marker, report
   "docs are already in sync" with the versions and stop.** Do not create a
   branch or PR. If only some products are stale, continue with just those.

## Phase 2: Study what changed

For each stale product:

1. Check out the release tag in the product checkout:
   ```bash
   git -C ../vibexp fetch --tags --force && git -C ../vibexp checkout <core-tag>
   git -C ../cli    fetch --tags --force && git -C ../cli    checkout <cli-tag>
   ```
2. Read the release notes for **every** release between the last synced
   version and the latest (`gh release view <tag> --repo <repo>
   --json body -q .body` per tag). For a first-time sync, read all releases.
3. Build a change inventory grouped by documentation impact: breaking
   changes, new features, changed behavior, removed features, infra changes
   (image, migrations, tooling versions, install methods).

## Phase 3: Worktree and parallel audit

1. Create an isolated git worktree for the docs changes (EnterWorktree or
   `git worktree add`), branched from `origin/main`.
2. Fan out **parallel read-only audit agents** (Explore agents), each
   verifying one slice of the docs against the product source at its release
   tag. Suggested slices (adjust to where the release notes point):

   **Core** (`../vibexp` at the core tag):
   - **Config and deployment**: `developer-guide/backend/configuration.md`,
     `developer-guide/deployment/*`, `user-guide/self-hosting/*` vs the
     config structs, example YAMLs, Dockerfile, compose files, migrations.
   - **Agents**: `user-guide/ai-agents.md` vs the agents backend and frontend.
   - **User features and search**: `user-guide/memory.md`, `artifacts.md`,
     `prompts/*`, `mcp-server.md`, `blueprints.md`, `feeds.md`,
     `integrations/*`, `resource-access-analytics.md` vs search
     implementation, settings UI, MCP tool registration, REST routes.
   - **Developer guide backend**: `developer-guide/backend/*`,
     `developer-guide/getting-started.md`, `developer-guide/intro.md` vs
     migrations list, Makefile, dev stack, OpenAPI layout, generators.
   - **Frontend and general**: `developer-guide/frontend/*`,
     `developer-guide/contributing/*`, `user-guide/intro.md`,
     `quick-start.md`, `contributing.md`, `open-source/`, `index.mdx` vs
     frontend structure, CI workflows, pre-commit hooks, toolchain versions.

   **CLI** (`../cli` at the cli tag):
   - **Install and updating**: install methods, upgrade paths, completions,
     man pages vs `README.md`, goreleaser config, `Makefile`, the update
     system in the source.
   - **Auth and configuration**: login flows, API keys, contexts, env vars,
     credential storage vs the auth and config packages under `internal/`.
   - **Commands**: every documented command, flag, exit code, and output
     format vs `cmd/` and the command implementations under `internal/`
     (and `docs/` in the cli repo for architecture claims).
3. Each agent must return, per doc file: findings with (a) doc location,
   (b) doc claim, (c) actual source behavior with file:line evidence,
   (d) suggested correction, plus a list of missing topics.

## Phase 4: Update the documentation

Apply the aggregated findings in the worktree:

- **Fix** every claim the source contradicts (routes, config keys, versions,
  commands, flags, UI labels, statuses, limits).
- **Add** pages or sections for shipped features that have no docs. CLI
  pages go under `user-guide/cli/`. Register new slugs in the `sidebar` in
  `astro.config.mjs`. Use root-absolute `/user-guide/...` or
  `/developer-guide/...` links.
- **Remove** documented features that do not exist in the source. Do not
  soften them; delete them.
- Follow the writing style rules. Do not introduce em dashes in any added or
  modified line.
- Keep YAML frontmatter valid: no unquoted colons inside `description`
  values.

## Phase 5: Validate

Run and require all green:

```bash
npm install
npm run build
npm run lint
npm run typecheck
npm run test
```

## Phase 6: Markers, commit, push, PR

1. Write each synced product's latest release tag into its marker file
   (`.vibexp-release` for core, `.vibexp-cli-release` for cli). Only touch
   the markers of products actually synced in this run.
2. Commit with a `docs: sync documentation with VibeXP <version>` message
   for core, `docs: sync documentation with VibeXP CLI <version>` for cli,
   or a combined `docs: sync documentation with VibeXP <version> and CLI
   <version>` when both changed, summarizing the changes.
3. Push and open a PR against `main`. The PR body must state: the product(s)
   and version range(s) synced, the notable rewrites/additions/removals, and
   that every change was validated against the product source at its release
   tag.

## Phase 7: Automated review loop

1. Run the automated PR review (the `lab-workflow:review-pr` skill if
   available, otherwise `/code-review`) on the new PR.
2. Fix every `now` finding in the worktree, re-validate (Phase 5), push.
3. Re-run the review. Repeat until the verdict is APPROVE.

## Phase 8: Hand off

Report the PR URL, what changed, and the review verdict. **Stop.** The human
merges. Do not merge, even with admin rights, unless explicitly asked in a
later message.
