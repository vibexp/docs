---
title: MCP Server
description: The OAuth 2.1 MCP resource server, the embedded Authorization Server, audience binding, and exposed tool groups.
---

The backend exposes a [Model Context Protocol](https://modelcontextprotocol.io/)
server so AI agents (Claude Code, Cursor, VS Code, and others) can read and write
VibeXP resources. It mounts at **`/mcp/v1/common`** in the same process as the
REST API.

This page covers the server from a backend/developer perspective. For end-user
setup (connecting your editor or agent), see
[the user guide](/user-guide/mcp-server/).

## OAuth 2.1 resource server

`/mcp/v1/common` is an **OAuth 2.1 resource server**. Tokens are minted
in-process by VibeXP's
[embedded OAuth 2.1 Authorization Server](/developer-guide/backend/authentication/#the-embedded-oauth-21-authorization-server) —
the endpoint accepts only bearer JWTs issued by that AS for this server's
resource identifier.

Two config keys point the resource server at the AS (see
[Configuration → MCP OAuth](/developer-guide/backend/configuration/#mcp-oauth-resource-server)):

| Key | Purpose |
| --- | --- |
| `mcp.oauth_issuer` | The trusted issuer. Signing keys are fetched from `<issuer>/oauth2/jwks.json` — the `jwks_uri` the embedded AS publishes in its RFC 8414 metadata. Empty (with the AS disabled) disables the endpoint: every token is rejected with 401. |
| `mcp.resource_uri` | Canonical MCP resource identifier and required token audience. |

In **local development both are auto-derived**: the AS auto-enables at
`http://localhost:<server.port>`, `mcp.oauth_issuer` defaults to that issuer,
and `mcp.resource_uri` to `<issuer>/mcp/v1/common` — a fresh checkout boots a
connectable MCP endpoint with zero auth configuration. In production set them
explicitly; if `mcp.oauth_issuer` is set it must equal
`auth.oauth_as.issuer_url`.

## Audience binding (RFC 8707)

The server enforces [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707) resource
indicators: a token is only accepted if its audience matches
`mcp.resource_uri`. This prevents a token issued for the MCP server from being
replayed against the REST API, and vice versa — the API surface explicitly
excludes the MCP resource URI from its default accepted audiences. See
[Authentication](/developer-guide/backend/authentication/) for how the two token
audiences are kept separate.

## Discovery

Clients discover the server's authorization requirements through the standard
protected-resource metadata endpoint (RFC 9728, path-insertion form — the
resource path is appended to the well-known prefix):

```text
/.well-known/oauth-protected-resource/mcp/v1/common
```

This advertises the resource identifier and the authorization server, letting an
MCP client begin the OAuth flow without hardcoded configuration. The 401
`WWW-Authenticate` challenge carries the absolute metadata URL, and older MCP
clients that probe the resource server for AS metadata at
`/.well-known/oauth-authorization-server` are redirected to the issuer's
document.

## The authorization-server side

Because the AS is embedded, the full client flow stays inside one process:

1. The client fetches the AS metadata at
   `<issuer>/.well-known/oauth-authorization-server` (RFC 8414).
2. It self-registers via **Dynamic Client Registration**
   (`POST /oauth2/register`, RFC 7591) — public clients with PKCE only.
3. It runs the authorization-code + PKCE flow through `/oauth2/authorize` and
   `/oauth2/token`.
4. The consent step is rendered by the **SPA**: the browser is redirected to
   `/oauth/consent` on the frontend, which requires a signed-in VibeXP user
   (bouncing through `/login?return_to=…` if needed) before the user can
   approve the client.

See [Authentication → The embedded OAuth 2.1 Authorization
Server](/developer-guide/backend/authentication/#the-embedded-oauth-21-authorization-server)
for endpoints, token TTLs, key rotation, and the consent flow in detail.

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

A single generic **`delete_resource`** tool (`vibexp_io_delete_resource`)
handles deletion across types — `resource_type` is one of `memory`,
`artifact`, `blueprint`, or `prompt` — so the tool surface stays small instead
of growing one delete tool per type.

For the public-facing server, tools follow the `vibexp_io_*` naming convention
(for example `vibexp_io_create_prompt`, `vibexp_io_search`).

:::note
The MCP mount is intentionally **not** documented in `openapi.yaml` — it speaks
the MCP protocol, not REST, so it is excluded from the spec's documentation-scope
policy. The same applies to the `/oauth2/*` protocol routes.
:::
