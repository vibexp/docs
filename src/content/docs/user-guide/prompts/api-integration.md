---
title: API Integration
description: Access and manage your prompts programmatically through the VibeXP REST API.
sidebar:
  order: 6
---

Access and manage prompts programmatically through the VibeXP REST API.

## Prerequisites

Before using the API, you need:

1. A VibeXP account on your deployed VibeXP app (your own VibeXP instance)
2. An API key with appropriate permissions

See the [API Keys guide](/user-guide/integrations/api-keys) for setup instructions.

## API Base URL

All API requests use the base URL:

```
https://<your-api-host>/api/v1
```

Prompt routes are **team-scoped**: every endpoint includes your team's id (or
slug) as the first path segment, shown as `{team_id}` in the endpoint
definitions and `<team-id>` in the example commands.

## Authentication

Include your API key in the `Authorization` header using Bearer token format:

```bash
Authorization: Bearer YOUR_API_KEY
```

## REST API Endpoints

### List All Prompts

Retrieve a list of all your prompts.

**Endpoint:**
```
GET /api/v1/{team_id}/prompts
```

**Example request:**
```bash
curl -X GET \
  https://<your-api-host>/api/v1/<team-id>/prompts \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**

The list is wrapped in the `{status, message, data}` envelope this endpoint has
always used. The prompts themselves are under `data.prompts`:

```json
{
  "status": "success",
  "message": "Prompts retrieved successfully",
  "data": {
    "prompts": [
      {
        "id": "prompt-123",
        "name": "Blog Post Template",
        "slug": "blog-post-template",
        "description": "Template for technical blog posts",
        "body": "Write a blog post about {{topic}}...",
        "user_id": "user-123",
        "team_id": "123e4567-e89b-12d3-a456-426614174000",
        "project_id": "123e4567-e89b-12d3-a456-426614174001",
        "status": "published",
        "mcp_expose": true,
        "is_shared": false,
        "labels": ["blog", "content", "marketing"],
        "version": 3,
        "created_at": "2025-01-01T10:00:00Z",
        "updated_at": "2025-01-10T15:30:00Z"
      }
    ],
    "total_count": 42,
    "page": 1,
    "per_page": 10,
    "total_pages": 5
  }
}
```

**Query parameters:**
- `status` - Filter by status (`draft` or `published`)
- `labels` - Comma-separated list of labels to filter by
- `search` - Search term matching the prompt **name and description** only, not the body
- `project_id` - Filter by project
- `mcp_expose` - Filter by MCP exposure flag (`true`/`false`)
- `shared` - Filter by share status (`true`/`false`)
- `freshness` - `stale` returns only prompts the team's freshness rules currently flag. `stale` is the only accepted value, anything else is a `400`. See [Resource Freshness](/user-guide/resource-freshness/)
- `sort_by` - Sort field (`name`, `status`, `updated_at`, `created_at`)
- `sort_order` - `asc` or `desc` (default `desc`)
- `page` - Page number for pagination
- `limit` - Results per page (default 10, max 100)

### Get Specific Prompt

Retrieve a single prompt by its **slug**. This route takes a slug only. Passing a
prompt's UUID returns `404`.

**Endpoint:**
```
GET /api/v1/{team_id}/prompts/{slug}
```

**Example request:**
```bash
curl -X GET \
  https://<your-api-host>/api/v1/<team-id>/prompts/blog-post-template \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**

The detail endpoint returns the prompt object unwrapped:

```json
{
  "id": "prompt-123",
  "name": "Blog Post Template",
  "slug": "blog-post-template",
  "description": "Template for technical blog posts",
  "body": "Write a blog post about {{topic}}...",
  "user_id": "user-123",
  "team_id": "123e4567-e89b-12d3-a456-426614174000",
  "project_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "published",
  "mcp_expose": true,
  "is_shared": false,
  "labels": ["blog", "content", "marketing"],
  "version": 3,
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-10T15:30:00Z"
}
```

A prompt's `{{placeholders}}` and its `@slug` references are **not** fields on the
prompt. They have their own endpoints:

| Endpoint | Returns |
| --- | --- |
| `GET /api/v1/{team_id}/prompts/{slug}/placeholders` | The placeholders the prompt expects |
| `GET /api/v1/{team_id}/prompts/{slug}/dependencies` | The prompts it references |

The detail response also carries `related`, `similar`, and (when the prompt is
flagged) `freshness`. See [Resource Freshness](/user-guide/resource-freshness/).

### Create New Prompt

Create a new prompt programmatically.

**Endpoint:**
```
POST /api/v1/{team_id}/prompts
```

**Example request:**
```bash
curl -X POST \
  https://<your-api-host>/api/v1/<team-id>/prompts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Description Template",
    "slug": "product-description-template",
    "description": "Template for e-commerce product descriptions",
    "body": "Write a product description for {{product_name}}...",
    "project_id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "draft",
    "mcp_expose": false,
    "labels": ["e-commerce", "marketing", "product"]
  }'
```

**Request body:**

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | 1 to 50 characters |
| `slug` | yes | 1 to 255 characters. **Not auto-generated**, you must supply it |
| `body` | yes | The prompt text |
| `project_id` | yes | UUID of the project the prompt belongs to |
| `description` | no | Max 200 characters |
| `status` | no | `draft` or `published` |
| `mcp_expose` | no | **Defaults to `true`** when omitted |
| `labels` | no | Max 10 labels, each max 50 characters |

**Response:**

`201 Created` with the full prompt object, the same shape the detail endpoint
returns:

```json
{
  "id": "prompt-456",
  "name": "Product Description Template",
  "slug": "product-description-template",
  "description": "Template for e-commerce product descriptions",
  "body": "Write a product description for {{product_name}}...",
  "user_id": "user-123",
  "team_id": "123e4567-e89b-12d3-a456-426614174000",
  "project_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "draft",
  "mcp_expose": false,
  "is_shared": false,
  "labels": ["e-commerce", "marketing", "product"],
  "version": 1,
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T10:00:00Z"
}
```

### Update Existing Prompt

Modify an existing prompt.

**Endpoint:**
```
PUT /api/v1/{team_id}/prompts/{slug}
```

**Example request:**
```bash
curl -X PUT \
  https://<your-api-host>/api/v1/<team-id>/prompts/blog-post-template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "body": "Updated prompt content..."
  }'
```

**Request body:**
All fields are optional. Only include fields you want to update:
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "body": "string",
  "project_id": "uuid",
  "status": "draft | published",
  "mcp_expose": "boolean",
  "labels": ["array of strings"]
}
```

**Response:**

`200 OK` with the full updated prompt object, the same shape the detail endpoint
returns.

### Delete Prompt

Permanently delete a prompt.

**Endpoint:**
```
DELETE /api/v1/{team_id}/prompts/{slug}
```

**Example request:**
```bash
curl -X DELETE \
  https://<your-api-host>/api/v1/<team-id>/prompts/old-template \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:** `204 No Content` with an **empty body**. There is no success
envelope to parse.

**Warning:** Deletion is permanent and cannot be undone. If other prompts reference the deleted prompt, those references will break.

## Other prompt endpoints

This page covers the five CRUD operations. The prompt API has more, all
team-scoped and all keyed by slug:

| Endpoint | What it does |
| --- | --- |
| `GET /prompts/labels` | Every label used across the team's prompts |
| `GET /prompts/{slug}/placeholders` | The `{{placeholders}}` the prompt expects |
| `GET /prompts/{slug}/dependencies` | The prompts this one references with `@slug` |
| `POST /prompts/{slug}/render` | Render the prompt with placeholder values filled in |
| `POST /prompts/{slug}/share` | Create a share link |
| `GET /prompts/{slug}/versions` | The prompt's version history |
| `GET /prompts/{slug}/versions/{version_number}` | One past version |
| `POST /prompts/{slug}/versions/{version_number}/restore` | Restore a past version |

Each is prefixed with `/api/v1/{team_id}`.

## Error Responses

Errors are **RFC 9457 Problem Details**, served with the
`application/problem+json` content type. Every error shares one envelope:

| Field | Meaning |
| --- | --- |
| `type` | URI identifying the problem type |
| `title` | Short summary of the problem type |
| `status` | HTTP status code |
| `detail` | Explanation specific to this occurrence |
| `code` | Application-specific error code |
| `request_id` | Request identifier, quote it when reporting a problem |
| `timestamp` | RFC 3339 time the error occurred |
| `instance` | URI of the specific occurrence |
| `validation_errors` | Field-level errors, present on validation failures |

**400 Bad Request**
```json
{
  "type": "https://<your-api-host>/errors/VALIDATION_FAILED",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request validation failed",
  "code": "VALIDATION_FAILED",
  "request_id": "abc123-def456",
  "timestamp": "2025-11-08T10:15:30Z",
  "instance": "/api/v1/<team-id>/prompts",
  "validation_errors": [
    { "field": "name", "message": "name is required" }
  ]
}
```

The other statuses use the same envelope, with `status`, `code` and `detail`
describing the case:

| Status | When |
| --- | --- |
| `400` | Malformed body, a failed field validation, or an unknown `freshness` / `sort_by` value |
| `401` | Missing or invalid API key |
| `403` | Authenticated, but not permitted in this team |
| `404` | No prompt with that slug in this team |
| `409` | A prompt with that slug already exists |
| `500` | Unexpected server error |

## Rate Limits

If your VibeXP instance has rate limiting enabled, the current limits are surfaced in the response headers below. The limits are set by whoever operates the instance — VibeXP is open source with no built-in paid tiers, so on a self-hosted deployment you configure (or disable) them yourself. See [Self-Hosting](/user-guide/self-hosting/).

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640000000
```

## Common Use Cases

### Sync Prompts to External System

Export all prompts for backup or migration:

```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://<your-api-host>/api/v1"
TEAM_ID = "your_team_id"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Get all prompts (the list is under `data`)
response = requests.get(f"{BASE_URL}/{TEAM_ID}/prompts", headers=headers)
prompts = response.json()["data"]["prompts"]

# Save to file
import json
with open("prompts_backup.json", "w") as f:
    json.dump(prompts, f, indent=2)
```

### Bulk Create Prompts

Create multiple prompts from templates:

```javascript
const axios = require('axios');

const API_KEY = 'your_api_key';
const BASE_URL = 'https://<your-api-host>/api/v1';
const TEAM_ID = 'your_team_id';
const headers = { 'Authorization': `Bearer ${API_KEY}` };

const PROJECT_ID = 'your_project_id';

const promptTemplates = [
  {
    name: 'Email Template - Welcome',
    slug: 'email-template-welcome',
    body: 'Write a welcome email...',
    project_id: PROJECT_ID,
    labels: ['email', 'onboarding']
  },
  {
    name: 'Email Template - Follow-up',
    slug: 'email-template-follow-up',
    body: 'Write a follow-up email...',
    project_id: PROJECT_ID,
    labels: ['email', 'sales']
  }
];

for (const template of promptTemplates) {
  await axios.post(`${BASE_URL}/${TEAM_ID}/prompts`, template, { headers });
}
```

### Programmatic Updates

Update all prompts with a specific label:

```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://<your-api-host>/api/v1"
TEAM_ID = "your_team_id"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Get all marketing prompts
response = requests.get(
    f"{BASE_URL}/{TEAM_ID}/prompts",
    headers=headers,
    params={"labels": "marketing"}
)
prompts = response.json()["data"]["prompts"]

# Add new label to all marketing prompts
for prompt in prompts:
    labels = (prompt["labels"] or []) + ["content-creation"]
    requests.put(
        f"{BASE_URL}/{TEAM_ID}/prompts/{prompt['slug']}",
        headers=headers,
        json={"labels": labels}
    )
```

### Integration with CI/CD

Deploy prompts as part of your build process:

```bash
#!/bin/bash

# Deploy prompts from source control
for file in prompts/*.json; do
    curl -X POST \
        https://<your-api-host>/api/v1/<team-id>/prompts \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$file"
done
```

## SDK Libraries

While VibeXP doesn't provide official SDKs yet, the REST API is compatible with standard HTTP clients in any language:

**Python**: `requests`, `httpx`
**JavaScript**: `axios`, `fetch`
**Go**: `net/http`
**Ruby**: `net/http`, `httparty`
**PHP**: `guzzle`, `curl`

## Webhooks

Webhooks for prompt events (create, update, delete) are on the roadmap. Check the [VibeXP website](https://vibexp.io) for updates.

## Best Practices

### Security

- Store API keys securely (environment variables, secrets management)
- Rotate API keys periodically
- Use separate API keys for different applications
- Never commit API keys to source control

### Performance

- Cache prompt data when possible to reduce API calls
- Use pagination for large result sets
- Implement exponential backoff for rate limit handling
- Batch operations when creating/updating multiple prompts

### Error Handling

- Always check HTTP status codes
- Implement retry logic for transient errors (500, 503)
- Log API errors for debugging
- Provide fallback behavior when API is unavailable

### Versioning

- The API version is included in the URL (`/api/v1`)
- Breaking changes will be introduced in new versions (`/api/v2`)
- Deprecated endpoints will be supported for at least 6 months
- Subscribe to API change notifications on the [VibeXP website](https://vibexp.io)

## Need Help?

- [API Keys Setup Guide](/user-guide/integrations/api-keys)
- [VibeXP Support](https://vibexp.io)
- [Return to Prompts Overview](/user-guide/prompts)
