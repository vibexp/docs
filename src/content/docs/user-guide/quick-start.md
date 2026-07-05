---
title: Quick Start
description: Get started with VibeXP in five minutes by signing in, building your first prompt, generating an API key, and connecting your AI tools.
sidebar:
  order: 2
---

Get started with VibeXP in 5 minutes. This guide will walk you through signing in, setting up your first prompt, and connecting your AI tools.

## Step 1: Sign In

1. Open your VibeXP instance (the deployed VibeXP app at your own domain)
2. On the login page, pick one of the sign-in providers your instance has configured — Google, GitHub, or your organization's own identity provider (OpenID Connect)
3. Complete the provider's sign-in flow — your VibeXP account is created automatically the first time you sign in

There is no separate signup form, no password to set, and no email verification step — your identity provider handles authentication.

## Step 2: Create Your First Prompt

Prompts are reusable AI templates that save you time and ensure consistent results.

1. Navigate to **Prompts** in the sidebar
2. Click **Create New Prompt**
3. Give your prompt a descriptive title
4. Write your prompt template using `{{variable}}` syntax for placeholders
5. Save as **Draft** or **Published**

### Example Prompt

```
Write a {{content_type}} about {{topic}} for {{audience}}.

The tone should be {{tone}} and approximately {{word_count}} words.
```

When you use this prompt, you'll fill in the variables with specific values.

## Step 3: Generate an API Key

API keys authenticate the **VibeXP CLI** and the **REST API** for programmatic access.

1. Go to **Settings** → **API Keys**
2. Click **Create New API Key**
3. Give it a descriptive name (e.g., "Work Laptop - CLI")
4. Copy and save your API key immediately (it's only shown once)

:::caution
Keep your API key secure! It provides access to all your VibeXP data.
:::

:::note[MCP does not use API keys]
The MCP integration in Step 4 authenticates with **OAuth 2.1**, not API keys — you do not pass this key to the MCP endpoint. The API key is only needed if you plan to use the CLI or REST API.
:::

## Step 4: Connect Your Tools (Optional)

Connect an MCP-OAuth-capable client (such as Claude Code) to access your VibeXP data directly. The MCP endpoint uses **OAuth 2.1** — you paste only the URL, and your client runs a one-time browser login. **No API key is passed to the MCP endpoint** (the API key from Step 3 is for the CLI and REST API, not MCP).

### For Claude Code CLI

Add the server with just the URL — Claude Code runs the OAuth login on first use:

```bash
claude mcp add --transport http vibexp_io_common \
  https://<your-mcp-host>/mcp/v1/common
```

The first time the server is used, Claude Code opens VibeXP's consent page in your browser — if you're not already signed in to VibeXP, you'll sign in first and be returned to the consent screen. Approve it once, and Claude Code reconnects automatically afterward.

### For Other Clients

Paste **only** the connection URL into your MCP client:

```
https://<your-mcp-host>/mcp/v1/common
```

If your client supports the **MCP OAuth 2.1** flow, it will send you to VibeXP's login and consent screen and then connect. If it does not support MCP OAuth, it cannot currently connect — the endpoint rejects API-key authentication with `401`. See [MCP Server Integration](/user-guide/mcp-server/#how-oauth-connect-works) for how the connect flow works.

:::tip[Working across teams]
You connect once with the team-agnostic URL above. Team-scoped tools (prompts, artifacts, memories) take a `team_id` (a team UUID or slug) on each call — just ask your AI assistant to call `vibexp_io_list_teams` to discover yours. See [MCP Server Integration](/user-guide/mcp-server/#working-with-teams) for details.
:::

:::note[Upgrading from an older config?]
If you previously used a per-team URL like `https://<your-mcp-host>/mcp/v1/teams/{team_uuid}/common`, update it to `https://<your-mcp-host>/mcp/v1/common` — the old URL has been removed.
:::

## Step 5: Start Creating

You're all set! Here's what you can do next:

- **Create More Prompts**: Build your personal prompt library
- **Store Artifacts**: Save AI-generated code, docs, and reports
- **Add Memories**: Store project context and preferences
- **Connect Agents**: Integrate A2A-compatible AI agents

## Core Concepts

### Prompts
Reusable templates with variable placeholders that save time and ensure consistency.

### Artifacts
Substantial AI-generated content (code, docs, reports) organized by project with powerful search.

### Memories
Context snippets that AI tools automatically reference in conversations, eliminating repetition.

### MCP Integration
Direct connection between AI tools and your VibeXP data for seamless workflows.

## Next Steps

- [Learn about Prompts](/user-guide/prompts)
- [Explore Artifacts](/user-guide/artifacts)
- [Understand Memory System](/user-guide/memory)
- [Set up MCP Integration](/user-guide/mcp-server)

## Need Help?

- Visit [vibexp.io](https://vibexp.io)
- Email support@example.com
