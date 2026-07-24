---
title: Blueprints
description: Blueprints are the rules and guidelines that shape your AI's behavior, organized per tool, readable by your AI assistants over MCP.
---

Blueprints are the **rules and guidelines that shape your AI's behavior**, organized per tool. Keep the conventions, standards, and operating instructions your AI should follow in one place, and let your assistants read them over MCP instead of you re-explaining them in every conversation.

## What are blueprints?

A blueprint is a piece of structured guidance: coding standards, architectural rules, review checklists, an API specification (OpenAPI, AsyncAPI, …), or any reference your AI should consult before it acts. Each blueprint has:

- **Title**: a human-readable name.
- **Slug**: a unique identifier within its project.
- **Project**: the grouping a blueprint belongs to (blueprints are addressed by project + slug).
- **Content**: the body of the blueprint (supports Markdown).
- **Description**: an optional short summary.
- **Status**: `active` or `expired` (archive without deleting).
- **Metadata**: optional custom key/value fields.
- **Path**: the canonical repo-relative path the blueprint maps to (for example `.claude/skills/deploy/SKILL.md` or `CLAUDE.md`). Derived server-side from the blueprint's type and subtype for VibeXP-authored blueprints, or the verbatim source path for imported ones. Display-only. See [Blueprint paths](#blueprint-paths).
- **Type and subtype**: which AI tool and category the blueprint targets (Claude Code, Cursor, Codex, and the Agent Skills category).
- **Source (provenance)**: for imported blueprints only, where it came from (source repo, commit, and import time). See [Importing blueprints from GitHub](#importing-blueprints-from-github).

## How blueprints differ from prompts and memory

Blueprints sit alongside [Prompts](/user-guide/prompts/) and [Memory](/user-guide/memory/), but each plays a distinct role:

- **[Prompts](/user-guide/prompts/)** are reusable instructions you *invoke* to start or steer a task (the request you send).
- **[Memory](/user-guide/memory/)** is durable context your AI reads and *updates as it learns* (facts, decisions, and preferences that accumulate over time).
- **Blueprints** are the standing *rules and guidelines* that shape how the AI works: the conventions it should follow, organized per tool. They change deliberately, not as a side effect of a conversation.

## Creating and editing blueprints

1. Navigate to **Blueprints** in the sidebar.
2. Click **Create** and fill in the details:
   - **Project**: the project this blueprint belongs to.
   - **Slug**: auto-derived from the title; must be unique within the project.
   - **Title** and optional **Description**.
   - **Content**: the guidance itself (Markdown supported).
   - **Status**: `active` by default.
   - **Metadata**: optional custom fields.
3. Click **Save**.

To edit, open a blueprint and choose **Edit**, make your changes, and save.

The create and edit form includes a key-value metadata editor for adding or changing metadata pairs directly in the UI.

:::note
A blueprint's slug is unique **per project**. Two projects can each have a blueprint with the same slug.
:::

## Project scoping

Blueprints are organized by **project**, and a blueprint is addressed by its project plus its slug. Use projects to keep each tool's or repository's rules separate, and filter the Blueprints list by project, status, or a search term across title, description, and content.

## Blueprint paths

Every blueprint maps to a **canonical repo-relative file path**, derived from its tool type and subtype (plus its slug). The path is display-only, shown on the blueprint detail view. It is computed server-side, so the create and edit form has no path field.

| Tool | Category | Path |
|---|---|---|
| Claude Code | Root file | `CLAUDE.md` |
| Claude Code | Sub-agents | `.claude/agents/<slug>.md` |
| Claude Code | Skills | `.claude/skills/<slug>/SKILL.md` |
| Claude Code | Slash commands | `.claude/commands/<slug>.md` |
| Claude Code | Other | `.claude/<slug>.md` |
| Cursor | Root file | `CURSOR.md` |
| Cursor | Rules | `.cursor/rules/<slug>.mdc` |
| Cursor | Skills | `.cursor/skills/<slug>/SKILL.md` |
| Cursor | Agents | `.cursor/agents/<slug>.md` |
| Cursor | Commands | `.cursor/commands/<slug>.md` |
| Codex | Root file | `AGENTS.md` |
| Codex | Rules | `.codex/rules/<slug>.md` |
| Codex | Skills | `.codex/skills/<slug>/SKILL.md` |
| Codex | Other | `.codex/<slug>.md` |

The mapping **round-trips**: importing a file at one of these paths classifies it back to the same type and subtype. On import, Codex config under `.agents/` is also recognized (and normalized to its `.codex/` equivalent).

## Version history

Blueprints keep a **content-version history**. Each save snapshots the previous content as a numbered version, so you can:

- **View version history**: browse past versions, newest first.
- **Inspect a version**: open any earlier snapshot.
- **Restore**: roll a blueprint back to an earlier version. The pre-restore content is snapshotted as a new version first, so you can move between recent snapshots freely.

:::note[Version retention limit]
Version history is bounded by an operator-configurable retention limit (**20 versions per blueprint by default**). When the limit is reached, the oldest versions are pruned as new ones are created, so don't rely on very old versions staying available forever on a default deployment.
:::

## Importing blueprints from GitHub

VibeXP can import AI-config files from a connected GitHub repository as per-tool blueprints, so you can bootstrap a project's rules from files you already keep in your repo.

- The repository must already exist as a VibeXP **project**.
- Only **Markdown** files are imported, and there are per-file and total size caps.
- Each imported file is classified into a blueprint type and subtype from its path (see [Blueprint paths](#blueprint-paths)).

### Provenance

Each imported blueprint records where it came from. The blueprint detail view shows:

- **Source**: the source repository.
- **Commit**: the branch head commit at import time.
- **Imported**: when the import ran.

VibeXP also captures the file's git blob SHA internally to detect changes on re-import (see below); it is not shown in the UI.

### Frontmatter fidelity

Nested YAML frontmatter is preserved on import. Recognized keys (`name` / `title` / `description`) are lifted into the corresponding blueprint fields; everything else is kept as metadata.

### Multi-file Agent Skills

A skill directory (a `SKILL.md` plus companion files such as scripts or references) imports as **one blueprint** (the `SKILL.md`), with the companion files stored as **attachments**. Each attachment is keyed by its relative subpath (for example `scripts/helper.py`). Companion relative paths are validated so they cannot escape the skill directory.

On re-import, companion files are added, replaced, or removed to match the repository.

### Update-aware re-import

Re-importing an existing blueprint reconciles by outcome, and **your local VibeXP edits are never overwritten**:

| Outcome | When it happens | Result |
|---|---|---|
| **Up to date** | The repo file is unchanged since the last import. | Nothing changes. |
| **Updated** | The repo file changed and you had not edited the blueprint in VibeXP. | The blueprint is refreshed from the repo. |
| **Conflict** | The repo file changed but you had edited the blueprint in VibeXP. | Your local edits are kept; the repo change is not applied. |

## How AI tools read blueprints over MCP

When your AI assistant is connected to VibeXP through the [MCP server](/user-guide/mcp-server/), it can create and update blueprints directly, and discover them through semantic search.

- `vibexp_io_create_blueprint`: create a new blueprint (project, slug, title, content, optional type/status/metadata, and an optional `path`). When `path` is omitted, VibeXP derives the canonical path from the type, subtype, and slug.
- `vibexp_io_update_blueprint`: update an existing blueprint, located by its project and slug.
- `vibexp_io_get_resource` / `vibexp_io_list_resources`: read blueprints by passing `resource_type: "blueprint"`: fetch one by `project_id` and `slug` (with full content), or list a project's blueprints as slim, filterable, paginated items.
- `vibexp_io_search`: find blueprints (and prompts, artifacts, and memories) by meaning; narrow to blueprints with the `types` filter.
- `vibexp_io_delete_resource`: delete a blueprint by passing `resource_type: "blueprint"` with its `project_id` and `slug`. The blueprint's search embeddings are removed alongside it.

```text
// AI tool creates a blueprint over MCP
vibexp_io_create_blueprint({
  team_id: "<team-uuid-or-slug>",
  project_id: "<project-uuid>",
  slug: "coding-standards",
  title: "Backend Coding Standards",
  content: "# Standards\n\n- Wrap errors with context\n- ..."
})
```

:::tip[Keep blueprints discoverable]
Give blueprints clear titles and descriptions. The richer the wording, the more reliably semantic search surfaces the right rules when an assistant needs them.
:::

## Related features

- [MCP Server Integration](/user-guide/mcp-server/): connect your AI tools to VibeXP.
- [Prompts](/user-guide/prompts/): reusable instructions you invoke.
- [Memory](/user-guide/memory/): durable context your AI reads and updates.
