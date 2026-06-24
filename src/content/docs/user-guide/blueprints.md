---
title: Blueprints
description: Blueprints are the rules and guidelines that shape your AI's behavior, organized per tool — readable by your AI assistants over MCP.
---

Blueprints are the **rules and guidelines that shape your AI's behavior**, organized per tool. Keep the conventions, standards, and operating instructions your AI should follow in one place, and let your assistants read them over MCP instead of you re-explaining them in every conversation.

## What are blueprints?

A blueprint is a piece of structured guidance — coding standards, architectural rules, review checklists, an API specification (OpenAPI, AsyncAPI, …), or any reference your AI should consult before it acts. Each blueprint has:

- **Title** — a human-readable name.
- **Slug** — a unique identifier within its project.
- **Project** — the grouping a blueprint belongs to (blueprints are addressed by project + slug).
- **Content** — the body of the blueprint (supports Markdown).
- **Description** — an optional short summary.
- **Status** — `active` or `expired` (archive without deleting).
- **Metadata** — optional custom key/value fields.

## How blueprints differ from prompts and memory

Blueprints sit alongside [Prompts](/user-guide/prompts/) and [Memory](/user-guide/memory/), but each plays a distinct role:

- **[Prompts](/user-guide/prompts/)** are reusable instructions you *invoke* to start or steer a task — the request you send.
- **[Memory](/user-guide/memory/)** is durable context your AI reads and *updates as it learns* — facts, decisions, and preferences that accumulate over time.
- **Blueprints** are the standing *rules and guidelines* that shape how the AI works — the conventions it should follow, organized per tool. They change deliberately, not as a side effect of a conversation.

## Creating and editing blueprints

1. Navigate to **Blueprints** in the sidebar.
2. Click **Create** and fill in the details:
   - **Project** — the project this blueprint belongs to.
   - **Slug** — auto-derived from the title; must be unique within the project.
   - **Title** and optional **Description**.
   - **Content** — the guidance itself (Markdown supported).
   - **Status** — `active` by default.
   - **Metadata** — optional custom fields.
3. Click **Save**.

To edit, open a blueprint and choose **Edit**, make your changes, and save.

:::note
A blueprint's slug is unique **per project**. Two projects can each have a blueprint with the same slug.
:::

## Project scoping

Blueprints are organized by **project**, and a blueprint is addressed by its project plus its slug. Use projects to keep each tool's or repository's rules separate, and filter the Blueprints list by project, status, or a search term across title, description, and content.

## Version history

Blueprints keep a **content-version history**. Each save snapshots the previous content as a numbered version, so you can:

- **View version history** — browse past versions, newest first.
- **Inspect a version** — open any earlier snapshot.
- **Restore** — roll a blueprint back to an earlier version. The pre-restore content is snapshotted as a new version first, so nothing is lost.

## How AI tools read blueprints over MCP

When your AI assistant is connected to VibeXP through the [MCP server](/user-guide/mcp-server/), it can create and update blueprints directly, and discover them through semantic search.

- `vibexp_io_create_blueprint` — create a new blueprint (project, slug, title, content, optional type/status/metadata).
- `vibexp_io_update_blueprint` — update an existing blueprint, located by its project and slug.
- `vibexp_io_search` — find blueprints (and prompts, artifacts, and memories) by meaning; narrow to blueprints with the `types` filter.

```text
// AI tool creates a blueprint over MCP
vibexp_io_create_blueprint({
  team_id: "<team-uuid-or-slug>",
  project_name: "my-api-project",
  slug: "coding-standards",
  title: "Backend Coding Standards",
  content: "# Standards\n\n- Wrap errors with context\n- ..."
})
```

:::tip[Keep blueprints discoverable]
Give blueprints clear titles and descriptions. The richer the wording, the more reliably semantic search surfaces the right rules when an assistant needs them.
:::

## Related features

- [MCP Server Integration](/user-guide/mcp-server/) — connect your AI tools to VibeXP.
- [Prompts](/user-guide/prompts/) — reusable instructions you invoke.
- [Memory](/user-guide/memory/) — durable context your AI reads and updates.
