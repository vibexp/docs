---
title: API Keys
description: Create and manage API keys for secure authentication of the VibeXP CLI, REST API, and IDE hook endpoints.
sidebar:
  order: 1
---

API Keys provide secure authentication for the VibeXP CLI and programmatic access to the VibeXP REST API, plus IDE hook endpoints — or build custom integrations.

:::note[MCP uses OAuth, not API keys]
The MCP endpoint (`https://<your-mcp-host>/mcp/v1/common`) now authenticates via **OAuth 2.1**, not API keys. Do not use an API key to connect to MCP — see [MCP Server Integration](/user-guide/mcp-server). API keys remain the way to authenticate the CLI and REST API, which is what this guide covers.
:::

## Overview

VibeXP API Keys act as secure tokens that authenticate your tools while accessing your personalized prompts, artifacts, memories, and other productivity features without requiring manual login each time.

An API key acts **as its owning user**. Every call is authorized as the key's owner, with that user's role in the target team, so a key can never do more than its owner can. See [Team roles & permissions](/user-guide/team-roles-and-permissions).

### Key Benefits

- **Seamless Integration**: No manual login required for tools
- **Enhanced Security**: Token-based auth with instant revocation
- **Usage Tracking**: Monitor when and where keys are used
- **Granular Control**: Select specific integrations per key
- **Multi-Integration Support**: One key for multiple tools
- **No Password Exposure**: Main account credentials stay secure

## Creating API Keys

### Step-by-Step

1. Log into your VibeXP instance (your deployed VibeXP app)
2. Navigate to **Settings** → **API Keys**
3. Click **Create New API Key**
4. Enter details:
   - **Name**: Descriptive name (e.g., "Development Setup", "CI/CD Pipeline")
   - **Select Integrations**: Choose one or more integrations this key can access (see Integration Types below)
5. Click **Create**
6. **IMMEDIATELY COPY THE KEY** - it's only shown once

:::caution[Important]
API keys are displayed only once during creation. Copy and save the key immediately. If you lose it, you'll need to create a new one.
:::

### Integration Types

When creating an API key, you can select which integrations it can access. This follows the principle of least privilege - grant only the permissions your key needs.

**Available Integrations:**

- **AI Tools Integration** (`ai_tools`)
  - Use with Claude Code, Cursor IDE, and other AI-powered development tools
  - Access prompts, artifacts, and memories for AI-assisted development

- **VibeXP CLI** (`cli`)
  - Access VibeXP from command-line interface for automation and scripting
  - Manage resources programmatically via CLI commands

- **MCP Server** (`mcp_server`) — *legacy*
  - This permission no longer grants access to the MCP endpoint. The MCP endpoint (`https://<your-mcp-host>/mcp/v1/common`) now authenticates via **OAuth 2.1**, not API keys — see [MCP Server Integration](/user-guide/mcp-server).
  - You do not need this permission to use MCP. It remains only for backward compatibility on existing keys.

**Multi-Integration Keys:**

You can select multiple integrations for a single API key. For example:
- **"Development Setup"**: AI Tools + CLI (for both IDE integration and command-line access)
- **"Automation Pipeline"**: CLI only (for CI/CD automation)
- **"Full Access"**: AI Tools + CLI (for comprehensive tool access)

:::tip[Best Practice]
Create separate keys for different use cases rather than using one key with all integrations. This improves security and makes it easier to track usage.
:::

### Key Format

VibeXP API keys follow this format:

```
vxk_1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab
```

- **Prefix**: `vxk_` identifies it as a VibeXP key (newer keys)
- **Token**: 64-character random string
- **Hashing**: Stored as SHA-256 hash for security

:::note[Legacy Keys]
Older API keys may have different prefixes (`aait_`, `acli_`, `amcp_`, `amkt_`, `ak_`, `vib_`). These legacy keys continue to work but are automatically granted all integration permissions. We recommend creating new keys with granular integration selection.
:::

## Using API Keys

### Connecting to MCP (not via API key)

The MCP endpoint does **not** use API keys. It authenticates with **OAuth 2.1**: you paste the URL `https://<your-mcp-host>/mcp/v1/common` into an MCP-OAuth-capable client (such as Claude Code), and the client runs a one-time browser login.

:::caution[Do not pass an API key to the MCP endpoint]
Sending an API key to the MCP endpoint — as a query parameter or an `Authorization` header — is rejected with `401`. For MCP setup, see [MCP Server Integration](/user-guide/mcp-server).
:::

The API key examples below (REST API and custom applications) target `https://<your-api-host>` and are unaffected by the MCP OAuth change.

### With REST API

Include the API key in the Authorization header:

```bash
curl -H "Authorization: Bearer vxk_YOUR_API_KEY_HERE" \
  https://<your-api-host>/api/v1/<team-id>/prompts
```

### With Custom Applications

```javascript
// Node.js example
const axios = require('axios');

const teamId = '<team-id>';
const client = axios.create({
  baseURL: 'https://<your-api-host>/api/v1',
  headers: {
    'Authorization': 'Bearer vxk_YOUR_API_KEY_HERE'
  }
});

// Fetch prompts (routes are team-scoped)
const prompts = await client.get(`/${teamId}/prompts`);
```

```python
# Python example
import requests

headers = {
    'Authorization': 'Bearer vxk_YOUR_API_KEY_HERE'
}

response = requests.get(
    'https://<your-api-host>/api/v1/<team-id>/prompts',
    headers=headers
)
prompts = response.json()
```

## Managing API Keys

### Viewing Keys

In the API Keys dashboard, you can see:

- **Key Name**: Your descriptive name
- **Prefix**: First few characters (e.g., `vxk_1234...`)
- **Integrations**: Color-coded badges showing which integrations the key can access
  - 🔵 **AI Tools** (blue badge)
  - 🟢 **CLI** (green badge)
  - 🟣 **MCP Server** (purple badge) — legacy; the MCP endpoint now uses OAuth 2.1, so this permission no longer applies to `/mcp/v1/common`
- **Legacy Badge**: Yellow badge indicates keys migrated from the old system
- **Created**: When the key was generated
- **Last Used**: Most recent usage timestamp

:::note
The full key is never displayed after creation for security reasons.
:::

### Revoking Keys

To revoke an API key:

1. Go to **Settings** → **API Keys**
2. Find the key to revoke
3. Click **Revoke** or **Delete**
4. Confirm the action

**Immediate Effect**: Tools using the revoked key lose access instantly.

### Rotating Keys

Periodically rotate keys for security:

1. Create a new API key
2. Update tool configurations with new key
3. Verify new key works
4. Revoke old key

Recommended rotation frequency: Every 90 days

## Security Best Practices

### Storage

✅ **Do:**
- Store keys in password managers
- Use environment variables in applications
- Keep keys in secure configuration files
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)

❌ **Don't:**
- Commit keys to version control (Git, SVN)
- Share keys in public channels (Slack, email)
- Store in plain text files
- Include in client-side code

### Usage

✅ **Do:**
- Use descriptive names for keys
- Create separate keys per tool/environment
- Monitor usage regularly
- Rotate keys periodically
- Revoke unused keys immediately

❌ **Don't:**
- Share keys between team members
- Use production keys in development
- Leave old keys active after rotation
- Use the same key across multiple projects

### Organization

**By Use Case (Recommended)**:
```
Development Setup (AI Tools + CLI)
CI/CD Pipeline (CLI only)
Automation Scripts (CLI only)
```

**By Tool**:
```
Work Laptop - Claude Code (AI Tools)
Work Laptop - Cursor (AI Tools)
CI/CD Pipeline - GitHub Actions (CLI only)
```

**By Environment**:
```
Development - Local (AI Tools + CLI)
Staging - Test Server (CLI)
Production - Main App (CLI only)
CI/CD - Automated Tests (CLI)
```

## Monitoring Usage

### Usage Dashboard

Track API key activity:

- **Last Used**: Timestamp of most recent use
- **Request Count**: Number of API calls
- **Tool Type**: Which tool is using the key
- **Actions**: What operations were performed

### Unusual Activity

Watch for:
- Keys used from unexpected locations
- Sudden spike in API calls
- Failed authentication attempts
- Usage after hours

If you notice suspicious activity:
1. Immediately revoke the key
2. Create a new key
3. Review recent account activity
4. Contact support if necessary

## Troubleshooting

### "Invalid API Key" Error

**Causes**:
- Key was revoked or deleted
- Typo in key (extra spaces, missing characters)
- Using wrong environment's key
- Key not properly configured in tool

**Solutions**:
- Verify key hasn't been revoked in dashboard
- Check for copy-paste errors
- Ensure no extra quotes or spaces
- Create new key if original is lost

### "Unauthorized" Error

**Causes**:
- The key owner's team role is too low for the action (a key can never do more than its owner)
- Trying to act on resources you don't own
- API key lacks the required integration permission
- Account suspended or restricted

**Solutions**:
- Confirm the key owner has a role in the target team that permits the action (see [Team roles & permissions](/user-guide/team-roles-and-permissions))
- Verify you're accessing your own data
- Check that your API key has the necessary integration enabled (e.g., the CLI integration for CLI access)
- If you are trying to reach the MCP endpoint, note that it does not accept API keys — it uses OAuth 2.1 (see [MCP Server Integration](/user-guide/mcp-server))
- Create a new key with the correct integrations if needed
- Check account status in dashboard
- Contact support if issue persists

### Tool Not Connecting

**Causes**:
- Incorrect tool configuration
- Network/firewall blocking requests
- Tool not restarted after configuration
- API key format issue

**Solutions**:
- Double-check configuration syntax
- Restart the tool completely
- Verify network access to <your-mcp-host>
- Review tool-specific documentation

## Rate Limits

### Current Limits

VibeXP is open source and has **no built-in paid tiers**. If rate limiting is enabled on your instance, the limits are defined by whoever operates it. On a self-hosted deployment you set (or disable) them yourself — see [Self-Hosting](/user-guide/self-hosting/).

### When Limit Exceeded

- HTTP 429 (Too Many Requests) returned
- Retry-After header indicates wait time
- Limits reset at top of each hour

### Handling Rate Limits

```javascript
// Implement exponential backoff
async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

## API Endpoints

### Authentication

All API requests require the Authorization header:

```
Authorization: Bearer vxk_YOUR_API_KEY_HERE
```

### Available Endpoints

All resource routes are team-scoped: `/api/v1/{team_id}/...`.

**Prompts**:
```
GET    /api/v1/{team_id}/prompts
GET    /api/v1/{team_id}/prompts/{id}
POST   /api/v1/{team_id}/prompts
PUT    /api/v1/{team_id}/prompts/{id}
DELETE /api/v1/{team_id}/prompts/{id}
```

**Artifacts**:
```
GET    /api/v1/{team_id}/artifacts
GET    /api/v1/{team_id}/artifacts/{project}/{slug}
POST   /api/v1/{team_id}/artifacts
PUT    /api/v1/{team_id}/artifacts/{project}/{slug}
DELETE /api/v1/{team_id}/artifacts/{project}/{slug}
```

**Memories**:
```
GET    /api/v1/{team_id}/memories
GET    /api/v1/{team_id}/memories/{id}
POST   /api/v1/{team_id}/memories
PUT    /api/v1/{team_id}/memories/{id}
DELETE /api/v1/{team_id}/memories/{id}
```

See full API documentation for detailed endpoint information.

## Frequently Asked Questions

### How many API keys can I create?

No limit. Create as many keys as needed for your tools and environments.

### Can I regenerate a lost API key?

No. If lost, you must create a new key and revoke the old one.

### Do API keys expire?

No automatic expiration, but we recommend rotating keys every 90 days for security.

### Can I limit what an API key can access?

Yes! When creating an API key, you can select which integrations it can access:
- **AI Tools Integration**: For Claude Code, Cursor IDE, and AI development tools
- **VibeXP CLI**: For command-line access and automation

This allows you to follow the principle of least privilege by granting only the permissions each key needs. (The MCP endpoint authenticates via OAuth 2.1, not API keys, so MCP access is not controlled by an API-key integration permission — see [MCP Server Integration](/user-guide/mcp-server).)

### Are there different types of API keys?

API keys are differentiated by their integration permissions. You can create keys with:
- Single integration access (e.g., CLI only)
- Multiple integration access (e.g., AI Tools + CLI)
- Full access (all integrations)

Legacy keys from the old system automatically have all integration permissions.

### Can I use the same key on multiple machines?

Yes, but we recommend separate keys per machine for better security and tracking.

## Related Features

- [MCP Server Integration](/user-guide/mcp-server) - Connect to MCP via OAuth 2.1 (no API key)
- [Quick Start](/user-guide/quick-start) - Get started with API keys
- [Prompts](/user-guide/prompts) - Access via API
- [Artifacts](/user-guide/artifacts) - Manage via API
- [Memory](/user-guide/memory) - Interact via API
