---
title: MCP Server
description: The OAuth 2.1 MCP resource server, audience binding, and exposed tool groups.
---

The backend exposes a [Model Context Protocol](https://modelcontextprotocol.io/)
server so AI agents (Claude Code, Cursor, VS Code, and others) can read and write
VibeXP resources. It mounts at **`/mcp/v1/common`** in the same process as the
REST API.

This page covers the server from a backend/developer perspective. For end-user
setup (connecting your editor or agent), see
[the user guide](/user-guide/mcp-server/).

## OAuth 2.1 resource server

`/mcp/v1/common` is an **OAuth 2.1 resource server** that delegates authorization
to WorkOS AuthKit. It accepts only AuthKit-issued bearer JWTs that were minted for
this server's resource identifier.

Two environment variables configure it (see
[Configuration → MCP OAuth](/developer-guide/backend/configuration/#mcp-oauth-resource-server)):

| Variable | Purpose |
| --- | --- |
| `MCP_OAUTH_ISSUER` | AuthKit issuer URL. JWKS is fetched from `<issuer>/oauth2/jwks`. Empty disables the endpoint (every token is rejected with 401). |
| `MCP_RESOURCE_URI` | Canonical MCP resource identifier and required token audience. No default; required to enable the endpoint. |

## Audience binding (RFC 8707)

The server enforces [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707) resource
indicators: a token is only accepted if its audience matches `MCP_RESOURCE_URI`.
This prevents a token issued for the MCP server from being replayed against the
REST API, and vice versa — the API surface explicitly excludes the MCP resource
URI from its default accepted audiences. See
[Authentication](/developer-guide/backend/authentication/) for how the two token
audiences are kept separate.

## Discovery

Clients discover the server's authorization requirements through the standard
protected-resource metadata endpoint:

```text
/.well-known/oauth-protected-resource
```

This advertises the resource identifier and the authorization server, letting an
MCP client begin the OAuth flow without hardcoded configuration.

## Exposed tool groups

The MCP server exposes tools across these resource groups:

- `prompts`
- `memories`
- `artifacts`
- `blueprints`
- `feeds`
- `search`
- `attachments`
- `projects`
- `teams`
- `user`

For the public-facing server, tools follow the `vibexp_io_*` naming convention
(for example `vibexp_io_create_prompt`, `vibexp_io_search`).

:::note
The MCP mount is intentionally **not** documented in `openapi.yaml` — it speaks
the MCP protocol, not REST, so it is excluded from the spec's documentation-scope
policy.
:::
