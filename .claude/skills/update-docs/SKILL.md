---
name: update-docs
description: Sync the documentation site with the latest published VibeXP release. Detects the release, audits every doc page against the release source with file:line evidence, fixes stale content, adds missing features, removes nonexistent ones, validates the site, opens a PR, and runs the automated review loop until approved. Use when asked to update the docs, sync docs with a release, or via /update-docs.
---

# Update Docs: sync documentation with the latest VibeXP release

Sync this documentation site with the **latest published release** of
[vibexp/vibexp](https://github.com/vibexp/vibexp), end to end: detect the
release, audit every doc page against the release source with evidence, fix
stale content, add missing features, remove content that does not exist,
validate the site, open a PR, run the automated review loop until it approves,
then stop and wait for human review.

## Hard rules

- **Docs track the latest published release, never `main`.** `main` may
  contain unreleased work that users cannot run. All validation happens
  against the release tag.
- **Every claim needs source evidence.** A doc statement survives only if the
  vibexp source at the release tag proves it (file:line). Never document a
  feature you could not find in the source. Remove or fix claims the source
  contradicts.
- **Writing style** (from CLAUDE.md): no em dashes anywhere in documentation
  content, concise and to the point, readable and easily scannable.
- **Never merge the PR.** The flow ends with an approved, unmerged PR waiting
  for the human.

## Phase 0: Preconditions

1. The main project must exist at the sibling path (`../vibexp` relative to
   the repo root, i.e. `$HOME/Projects/vibexp` when this repo is at
   `$HOME/Projects/docs`). If missing:
   ```bash
   git clone https://github.com/vibexp/vibexp.git ../vibexp
   ```
2. `gh` must be authenticated (`gh auth status`). If not, stop and ask the
   user to authenticate.

## Phase 1: Determine versions

1. Latest published release:
   ```bash
   gh release view --repo vibexp/vibexp --json tagName -q .tagName
   ```
2. Last synced release: read the `.vibexp-release` file at this repo's root.
   If the file is missing, infer the last synced version from git history
   (`git log --oneline`, look for the most recent docs-sync commit) and treat
   the marker as needing creation.
3. **If the latest release equals the marker, report "docs are already in
   sync with <version>" and stop.** Do not create a branch or PR.

## Phase 2: Study what changed

1. Check out the release tag in the vibexp checkout:
   ```bash
   git -C ../vibexp fetch --tags --force
   git -C ../vibexp checkout <latest-tag>
   ```
2. Read the release notes for **every** release between the last synced
   version and the latest (`gh release view <tag> --repo vibexp/vibexp
   --json body -q .body` per tag).
3. Build a change inventory grouped by documentation impact: breaking
   changes, new features, changed behavior, removed features, infra changes
   (image, migrations, tooling versions).

## Phase 3: Worktree and parallel audit

1. Create an isolated git worktree for the docs changes (EnterWorktree or
   `git worktree add`), branched from `origin/main`.
2. Fan out **parallel read-only audit agents** (Explore agents), each
   verifying one slice of the docs against the vibexp source at the release
   tag. Suggested slices (adjust to where the release notes point):
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
3. Each agent must return, per doc file: findings with (a) doc location,
   (b) doc claim, (c) actual source behavior with file:line evidence,
   (d) suggested correction, plus a list of missing topics.

## Phase 4: Update the documentation

Apply the aggregated findings in the worktree:

- **Fix** every claim the source contradicts (routes, config keys, versions,
  UI labels, statuses, limits).
- **Add** pages or sections for shipped features that have no docs. Register
  new slugs in the `sidebar` in `astro.config.mjs`. Use root-absolute
  `/user-guide/...` or `/developer-guide/...` links.
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

## Phase 6: Marker, commit, push, PR

1. Write the latest release tag into `.vibexp-release`.
2. Commit with a `docs: sync documentation with VibeXP <version>` message
   summarizing user-guide and developer-guide changes.
3. Push and open a PR against `main`. The PR body must state: the version
   range synced, the notable rewrites/additions/removals, and that every
   change was validated against the vibexp source at the release tag.

## Phase 7: Automated review loop

1. Run the automated PR review (the `lab-workflow:review-pr` skill if
   available, otherwise `/code-review`) on the new PR.
2. Fix every `now` finding in the worktree, re-validate (Phase 5), push.
3. Re-run the review. Repeat until the verdict is APPROVE.

## Phase 8: Hand off

Report the PR URL, what changed, and the review verdict. **Stop.** The human
merges. Do not merge, even with admin rights, unless explicitly asked in a
later message.
