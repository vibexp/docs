---
title: MCP Server Integration
description: Give your AI assistants direct OAuth 2.1 access to your VibeXP prompts, artifacts, and memories through the Model Context Protocol.
sidebar:
  order: 6
---

Give your AI assistants direct access to your VibeXP data through the Model Context Protocol (MCP). The VibeXP MCP server is an OAuth 2.1 Resource Server (MCP spec 2025-06-18): MCP-OAuth-capable clients such as Claude Code connect by pasting a single URL — no API key required.

## Overview

VibeXP's MCP server acts as a bridge between your AI development tools and your organized data ecosystem. Your AI assistants can access prompts, artifacts, and memories without manual copy-pasting.

### Key Benefits

- **Direct AI Access**: Tools fetch your data automatically
- **No Manual Copying**: Seamless workflow integration
- **Secure**: OAuth 2.1 authentication — no API key to copy, paste, or leak
- **Real-Time Sync**: Always access latest data
- **MCP-OAuth Clients**: Works with MCP-OAuth-capable clients such as Claude Code

## What is MCP?

Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to external data sources. It provides a standardized way for AI tools to access contextual information while maintaining strict security controls.

### How VibeXP Uses MCP

VibeXP implements MCP to expose your data as **resources** and **tools**:

- **Resources**: Read-only access to your prompts, artifacts, and memories
- **Tools**: Actions AI can perform (create, search, update data)

## Setup Guide

### Prerequisites

1. **VibeXP Account**: Sign up on your deployed VibeXP app (your own VibeXP instance)
2. **An MCP-OAuth-capable client**: A client that supports the MCP OAuth 2.1 authorization flow (for example, Claude Code). No API key is needed to connect — see [For Other Clients](#for-other-clients) below.

:::tip[No API key required for MCP]
The MCP endpoint authenticates with **OAuth 2.1**, not API keys. You do **not** generate or paste an API key to connect — your client runs a one-time login the first time it talks to the server. (API keys are still used for the CLI and the REST API — see [API keys still apply outside MCP](#api-keys-still-apply-outside-mcp).)
:::

### Connection URL

VibeXP exposes a single, team-agnostic MCP endpoint:

```
https://<your-mcp-host>/mcp/v1/common
```

To connect, you **paste only this URL** into your MCP client. There is no API key, no `client_id`, and no `client_secret` to enter — the client discovers the authorization server and runs the login flow automatically (see [How OAuth Connect Works](#how-oauth-connect-works)).

Team context is **not** part of the URL — instead, team-scoped tools accept a `team_id` parameter on each call (see [Working With Teams](#working-with-teams) below).

:::danger[Breaking change: connection URL has changed]
The previous per-team URL `https://<your-mcp-host>/mcp/v1/teams/{team_uuid}/common` has been **removed** and now returns `404`. This is a hard cutover with no backward compatibility.

If you have an existing configuration that points at a `.../teams/{team_uuid}/common` URL, you **must** update it to `https://<your-mcp-host>/mcp/v1/common`. You no longer embed your team UUID in the URL — pass `team_id` per tool call instead.
:::

### For Claude Code CLI

Add the VibeXP MCP server (no auth flag — Claude Code runs the OAuth login on first use):

```bash
claude mcp add --transport http vibexp_io_common \
  https://<your-mcp-host>/mcp/v1/common
```

The first time the server is used, Claude Code opens an AuthKit login/consent page in your browser. Approve it once and Claude Code stores the resulting token; subsequent sessions reconnect automatically.

Verify the connection:

```bash
claude mcp list
```

### For Other Clients

For any other MCP client, paste **only** the connection URL:

```
https://<your-mcp-host>/mcp/v1/common
```

Whether this works depends entirely on whether your client implements the **MCP OAuth 2.1** authorization flow:

- **If your client supports MCP OAuth** (auto-discovery, Dynamic Client Registration, and PKCE), it will prompt you to log in via AuthKit on first use and then connect — exactly as Claude Code does. Just paste the URL.
- **If your client does not support MCP OAuth**, it cannot currently connect to the VibeXP MCP endpoint. The endpoint rejects API-key authentication (both `?api_key=` and `Authorization: Bearer <api_key>`) with `401`.

:::caution[Do not pass an API key to the MCP endpoint]
Configurations that send an API key to `https://<your-mcp-host>/mcp/v1/common` — as a query parameter or an `Authorization` header — are rejected with `401`. The endpoint accepts only OAuth bearer tokens issued by the connect flow. If your client cannot perform the OAuth flow, it cannot use MCP today.
:::

## How OAuth Connect Works

When you paste the URL, an MCP-OAuth-capable client performs a standards-based handshake on your behalf. You normally only see a single browser login/consent screen; the rest happens automatically:

1. **Discover** — The client first calls `https://<your-mcp-host>/mcp/v1/common` with no token. The server replies `401` with a `WWW-Authenticate: Bearer` header pointing at the protected-resource metadata document.
2. **Read metadata** — The client fetches that public metadata document. It names the AuthKit authorization server the client should use.
3. **Register** — The client self-registers with AuthKit via Dynamic Client Registration (DCR), obtaining a `client_id`. You do not create or paste one.
4. **Log in** — The client starts a PKCE authorization request. AuthKit shows you a login and consent screen in your browser; you approve access.
5. **Get a token** — The client exchanges the resulting authorization code (plus its PKCE verifier and the MCP resource URL) for a short-lived RS256 JWT bound to the VibeXP MCP resource (its `aud` claim is the MCP resource URI).
6. **Connect** — The client sends `POST https://<your-mcp-host>/mcp/v1/common` with `Authorization: Bearer <JWT>` and receives `200`. From here, tools work normally.

Tokens are short-lived and audience-bound. When one expires, an OAuth-capable client refreshes or re-runs the login flow automatically — you usually won't notice.

### Advanced: Discovery Endpoints

These public, no-auth endpoints power the handshake above. You normally never call them yourself — they are documented here for client developers and advanced troubleshooting:

- `GET /.well-known/oauth-protected-resource/mcp/v1/common` — RFC 9728 protected-resource metadata. Returns the resource identifier, the AuthKit authorization server(s), and the supported bearer methods, e.g.:

  ```json
  {
    "resource": "https://<your-mcp-host>/mcp/v1/common",
    "authorization_servers": ["https://<your-authkit-issuer>"],
    "bearer_methods_supported": ["header"]
  }
  ```

- `GET /.well-known/oauth-authorization-server` — Returns a `302` redirect to the AuthKit authorization-server metadata, as a convenience for clients that look for the authorization-server document at the resource root.

### API Keys Still Apply Outside MCP

OAuth is only for the **MCP endpoint**. API keys are still the way to authenticate everything else, and they continue to work unchanged:

- The **VibeXP CLI**
- The **REST API** (`https://<your-api-host>/api/v1/...` with `Authorization: Bearer vxk_…`)
- IDE hook endpoints (`/api/v1/claude-code/hooks`, `/api/v1/cursor-ide/hooks`)
- Resource-usage routes

So you don't need an API key to connect to MCP, but you still create one for CLI and programmatic access. See the [API Keys guide](/user-guide/integrations/api-keys) for details.

## Working With Teams

Most VibeXP data — prompts, artifacts, memories, and feeds — belongs to a **team**. Because the MCP endpoint is now team-agnostic, every team-scoped tool requires you to specify **which** team a call applies to.

### The `team_id` parameter

Team-scoped tools take a **required `team_id`** parameter on each call. It accepts either:

- a team **UUID** (e.g. `f47ac10b-58cc-4372-a567-0e02b2c3d479`), or
- a team **slug** (e.g. `acme-engineering`).

```
You: "List my prompts in the acme-engineering team"

AI: *Calls a prompt tool with team_id="acme-engineering"*
```

:::tip
You only need a team identifier once per conversation. After the AI discovers your teams (see below), it can reuse the same `team_id` for subsequent calls in that session.
:::

### Finding your team identifier

There are two ways to get a team's UUID or slug:

1. **From the app** — Open the **MCP Connect** page in VibeXP. Each of your teams is listed with its UUID and slug, ready to copy.
2. **From the MCP tool** — Ask your AI assistant to call **`vibexp_io_list_teams`**. It returns every team you belong to, so the assistant can pick the right identifier without you leaving your editor.

### Discovering teams with `vibexp_io_list_teams`

The `vibexp_io_list_teams` tool returns the teams the authenticated user belongs to. Each entry includes the team's `uuid`, `name`, and `slug`:

```json
{
  "teams": [
    {
      "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Acme Engineering",
      "slug": "acme-engineering"
    },
    {
      "uuid": "9b2e6f1a-3c4d-4e5f-8a6b-1c2d3e4f5a6b",
      "name": "Personal",
      "slug": "personal"
    }
  ]
}
```

A typical flow looks like this:

```
You: "Save this snippet to my Acme Engineering artifacts"

AI: *Calls vibexp_io_list_teams to discover teams*
    *Finds "Acme Engineering" → slug "acme-engineering"*
    *Calls vibexp_io_create_artifact with team_id="acme-engineering"*
    *Confirms: "Saved to Acme Engineering"*
```

:::note
`vibexp_io_list_teams` is the one tool that does **not** take a `team_id` — it exists precisely to help you (or the AI) discover one.
:::

## Available Tools

Once connected, AI assistants can use these tools.

:::note
Tools that read or write team data require a `team_id` (UUID or slug) argument. Use `vibexp_io_list_teams` to discover valid identifiers — see [Working With Teams](#working-with-teams).
:::

### Team Discovery

- **vibexp_io_list_teams**: List the teams you belong to (returns `uuid`, `name`, `slug`). Use the result to supply `team_id` to other tools.

### DateTime Tools

- **vibexp_io_current_date_time**: Get current date/time with timezone support

### Prompt Management

- **vibexp_io_search_prompts**: Search your prompt library
- **vibexp_io_get_prompt**: Retrieve specific prompt by ID

### Artifact Management

- **vibexp_io_create_artifact**: Create new artifacts
- **vibexp_io_search_artifacts**: Search artifacts by project/content
- **vibexp_io_get_artifact**: Retrieve specific artifact
- **vibexp_io_update_artifact**: Modify existing artifacts

### Memory Operations

- **vibexp_io_create_memory**: Store new memories
- **vibexp_io_search_memories**: Search memory library
- **vibexp_io_get_memory**: Retrieve specific memory
- **vibexp_io_update_memory**: Update existing memories

## Usage Examples

### Accessing Prompts

```
You: "Use my blog post template to write about AI"

AI: *Automatically searches your prompts for "blog post template"*
    *Retrieves the template using vibexp_io_get_prompt*
    *Applies template with your topic*
```

### Creating Artifacts

```
You: "Save this code snippet for later"

AI: *Creates artifact using vibexp_io_create_artifact*
    *Stores in your specified project*
    *Confirms: "Saved to artifacts/code-snippets"*
```

### Using Memories

```
You: "Write a function following my coding standards"

AI: *Searches memories using vibexp_io_search_memories*
    *Finds your TypeScript coding preferences*
    *Applies standards automatically in code*
```

### Searching Content

```
You: "Show me all my React components"

AI: *Searches artifacts using vibexp_io_search_artifacts*
    *Filters by project and content*
    *Lists matching artifacts with previews*
```

## Common Workflows

### Code Review with Context

```markdown
1. AI reads your coding standards (from Memories)
2. Reviews code against standards
3. Saves review as Artifact
4. References previous reviews for consistency
```

### Documentation Generation

```markdown
1. AI accesses project specs (from Memories)
2. Reviews existing code (from Artifacts)
3. Generates documentation following template (from Prompts)
4. Saves as new Artifact
```

### Template-Based Content Creation

```markdown
1. You request content using a template name
2. AI searches and retrieves template (from Prompts)
3. Fills template with your specific requirements
4. Optionally saves result (to Artifacts)
```

## Security and Privacy

### Authentication

- **OAuth 2.1 Bearer Tokens**: Every MCP request carries a short-lived, audience-bound JWT issued by AuthKit through the connect flow — never an API key
- **No Long-Lived Secret to Leak**: There is no API key to copy, paste, or accidentally commit; tokens expire and are refreshed automatically by your client
- **Audience-Bound**: Tokens are valid only for the VibeXP MCP resource (`aud` = the MCP resource URI), so a token cannot be replayed against other services
- **User Isolation**: Access only your data, never other users'

### Data Transfer

- **HTTPS Encryption**: All data encrypted in transit (TLS 1.3)
- **No Data Sharing**: Your data never shared with third parties
- **Audit Logs**: Complete logging of all access

### Access Control

- **Short-Lived Tokens**: Access tokens expire quickly and are re-issued by the OAuth flow as needed
- **Usage Tracking**: Monitor MCP sessions and tool calls from your dashboard
- **Scope Limiting**: Tokens grant access only to your VibeXP data

## Monitoring and Management

### Usage Dashboard

Track MCP usage in your VibeXP dashboard:

- **Sessions**: View AI tool sessions
- **Tool Calls**: Monitor which tools are used
- **Data Access**: See accessed prompts/artifacts/memories
- **Performance**: Response times and errors

### Session Tracking

For Claude Code CLI specifically:

1. Navigate to **MCP Server** → **Claude Code Sessions**
2. View all sessions with:
   - Duration and timing
   - Tool usage statistics
   - Hooks triggered
   - Errors and warnings

### Connection Status

Because MCP uses OAuth, there is no API key to manage for the MCP endpoint. To re-authorize a client, simply re-run its connect flow (it will prompt you to log in again). Access tokens are short-lived and refreshed automatically, so there is nothing to rotate or revoke manually for MCP.

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to MCP server"

**Solutions**:
- Confirm the URL is `https://<your-mcp-host>/mcp/v1/common` — the old per-team URL (`/mcp/v1/teams/{team_uuid}/common`) is removed and returns `404`
- Make sure your client **supports MCP OAuth 2.1** — clients without OAuth support cannot connect (the endpoint no longer accepts API keys)
- Remove any API-key header or `?api_key=` query parameter from your configuration — sending one returns `401`
- Re-run the connect flow so your client can complete the OAuth login/consent in the browser
- Check internet connection and that the tool is properly configured

### Authorization Errors

**Problem**: "Unauthorized" or `401` when connecting

**Solutions**:
- Confirm you are connecting with OAuth (paste the URL) and **not** sending an API key — API-key authentication is rejected at the MCP endpoint
- Complete the AuthKit login and consent prompt your client opens on first use
- If a token expired, your client normally refreshes it automatically; if it doesn't, re-run the connect flow to re-authenticate
- Verify your client supports the MCP OAuth flow (auto-discovery, Dynamic Client Registration, PKCE)

### Tool Not Available

**Problem**: AI says "I don't have access to that tool"

**Solutions**:
- Verify MCP server is properly configured and connected via OAuth
- Restart your AI tool
- Check MCP server is listed in tool settings
- Re-run the connect flow if your session is no longer authorized

### Slow Response Times

**Problem**: Queries take too long

**Solutions**:
- Check internet connection speed
- Verify VibeXP service status
- Try during off-peak hours
- Contact support if persistent

## Best Practices

### Connection Security

- Use an MCP-OAuth-capable client so authentication is handled by the OAuth 2.1 flow — there is no API key to store or protect for MCP
- Only approve the AuthKit login/consent prompt when you actually initiated the connection
- Let your client manage and refresh tokens automatically; do not attempt to extract or reuse the bearer token elsewhere
- To stop a client's access, sign out / disconnect it in your client (it will need to re-run the connect flow to reconnect)

### Data Organization

- Keep prompts, artifacts, and memories well-organized
- Use consistent naming conventions
- Add descriptive metadata and tags
- Regular cleanup of outdated content

### Tool Usage

- Let AI search first before manually specifying
- Use descriptive project names for better filtering
- Leverage metadata for enhanced searchability
- Create artifacts during conversations for future reference

## Frequently Asked Questions

### Do I need an API key to use MCP?

No. The MCP endpoint authenticates with **OAuth 2.1**, not API keys. You connect by pasting the URL (`https://<your-mcp-host>/mcp/v1/common`) into an MCP-OAuth-capable client, which then runs a one-time browser login. Sending an API key to the MCP endpoint — as a query parameter or `Authorization` header — is rejected with `401`. API keys are still used for the CLI and REST API; see [API keys still apply outside MCP](#api-keys-still-apply-outside-mcp).

### Can I use MCP offline?

No. MCP requires an internet connection both to complete the OAuth login and to access your VibeXP data securely.

### Is there a rate limit?

Yes, reasonable rate limits prevent abuse. Contact support if you need higher limits for your use case.

### Which clients can connect to MCP?

Any client that implements the **MCP OAuth 2.1** authorization flow (auto-discovery, Dynamic Client Registration, and PKCE) can connect by pasting the URL — Claude Code is a confirmed example. Clients that do not support MCP OAuth cannot currently connect, because the endpoint no longer accepts API-key authentication.

### Why does connecting to MCP with my API key fail with 401?

Because the MCP endpoint is now an OAuth 2.1 Resource Server and no longer accepts API keys. Remove any API-key header or `?api_key=` parameter from your MCP configuration and connect by pasting the URL into an MCP-OAuth-capable client instead.

### Why do I need to pass a `team_id` now?

The MCP endpoint used to embed your team UUID in the URL (`/mcp/v1/teams/{team_uuid}/common`). That URL has been removed. You now connect to a single team-agnostic URL (`/mcp/v1/common`) and tell each team-scoped tool which team to act on via the `team_id` parameter. This lets one MCP connection work across all of your teams. Use `vibexp_io_list_teams` to find a team's UUID or slug.

### My MCP server stopped working after an update — what changed?

If you configured MCP before this change, your config likely points at the old `https://<your-mcp-host>/mcp/v1/teams/{team_uuid}/common` URL, which now returns `404`. Update the URL to `https://<your-mcp-host>/mcp/v1/common` and reconnect. No team UUID belongs in the URL anymore.

### Is my data cached by AI tools?

AI tools may temporarily cache data during sessions, but it's not persisted. Your canonical data always lives in VibeXP.

## Support and Resources

- **Documentation**: [docs.vibexp.io](https://docs.vibexp.io)
- **Status Page**: your deployment's status page (e.g. `https://<your-status-page>`)
- **Email Support**: support@example.com
- **GitHub**: [github.com/shaharia-lab](https://github.com/shaharia-lab)

## Related Features

- [API Keys](/user-guide/integrations/api-keys) - Generate and manage API keys
- [Prompts](/user-guide/prompts) - Access via MCP
- [Artifacts](/user-guide/artifacts) - Create and retrieve via MCP
- [Memory](/user-guide/memory) - Auto-inject via MCP
