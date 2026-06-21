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
GET /api/v1/prompts
```

**Example request:**
```bash
curl -X GET \
  https://<your-api-host>/api/v1/prompts \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "prompts": [
    {
      "id": "prompt-123",
      "slug": "blog-post-template",
      "title": "Blog Post Template",
      "description": "Template for technical blog posts",
      "status": "published",
      "available_in_mcp": true,
      "labels": ["blog", "content", "marketing"],
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-10T15:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

**Query parameters:**
- `status` - Filter by status (`draft` or `published`)
- `label` - Filter by label
- `search` - Search in title, description, or content
- `page` - Page number for pagination
- `per_page` - Results per page (max 100)

### Get Specific Prompt

Retrieve a single prompt by ID or slug.

**Endpoint:**
```
GET /api/v1/prompts/{id_or_slug}
```

**Example request:**
```bash
curl -X GET \
  https://<your-api-host>/api/v1/prompts/blog-post-template \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "prompt-123",
  "slug": "blog-post-template",
  "title": "Blog Post Template",
  "description": "Template for technical blog posts",
  "content": "Write a blog post about {{topic}}...",
  "status": "published",
  "available_in_mcp": true,
  "labels": ["blog", "content", "marketing"],
  "variables": ["topic", "audience", "word_count"],
  "references": ["@company-voice", "@blog-structure"],
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-10T15:30:00Z"
}
```

### Create New Prompt

Create a new prompt programmatically.

**Endpoint:**
```
POST /api/v1/prompts
```

**Example request:**
```bash
curl -X POST \
  https://<your-api-host>/api/v1/prompts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Description Template",
    "description": "Template for e-commerce product descriptions",
    "content": "Write a product description for {{product_name}}...",
    "status": "draft",
    "available_in_mcp": false,
    "labels": ["e-commerce", "marketing", "product"]
  }'
```

**Request body:**
```json
{
  "title": "string (required)",
  "description": "string (optional, max 200 chars)",
  "content": "string (required)",
  "status": "draft | published (optional, default: draft)",
  "available_in_mcp": "boolean (optional, default: false)",
  "labels": ["array of strings (optional, max 10)"],
  "slug": "string (optional, auto-generated if not provided)"
}
```

**Response:**
```json
{
  "id": "prompt-456",
  "slug": "product-description-template",
  "title": "Product Description Template",
  "message": "Prompt created successfully"
}
```

### Update Existing Prompt

Modify an existing prompt.

**Endpoint:**
```
PUT /api/v1/prompts/{id_or_slug}
```

**Example request:**
```bash
curl -X PUT \
  https://<your-api-host>/api/v1/prompts/blog-post-template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "content": "Updated prompt content..."
  }'
```

**Request body:**
All fields are optional. Only include fields you want to update:
```json
{
  "title": "string",
  "description": "string",
  "content": "string",
  "status": "draft | published",
  "available_in_mcp": "boolean",
  "labels": ["array of strings"]
}
```

**Response:**
```json
{
  "id": "prompt-123",
  "slug": "blog-post-template",
  "message": "Prompt updated successfully"
}
```

### Delete Prompt

Permanently delete a prompt.

**Endpoint:**
```
DELETE /api/v1/prompts/{id_or_slug}
```

**Example request:**
```bash
curl -X DELETE \
  https://<your-api-host>/api/v1/prompts/old-template \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "message": "Prompt deleted successfully"
}
```

**Warning:** Deletion is permanent and cannot be undone. If other prompts reference the deleted prompt, those references will break.

## Error Responses

The API uses standard HTTP status codes:

**400 Bad Request**
```json
{
  "error": "validation_error",
  "message": "Invalid request data",
  "details": {
    "title": "Title is required",
    "labels": "Maximum 10 labels allowed"
  }
}
```

**401 Unauthorized**
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing API key"
}
```

**404 Not Found**
```json
{
  "error": "not_found",
  "message": "Prompt not found"
}
```

**429 Too Many Requests**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

**500 Internal Server Error**
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

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
headers = {"Authorization": f"Bearer {API_KEY}"}

# Get all prompts
response = requests.get(f"{BASE_URL}/prompts", headers=headers)
prompts = response.json()["prompts"]

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
const headers = { 'Authorization': `Bearer ${API_KEY}` };

const promptTemplates = [
  {
    title: 'Email Template - Welcome',
    content: 'Write a welcome email...',
    labels: ['email', 'onboarding']
  },
  {
    title: 'Email Template - Follow-up',
    content: 'Write a follow-up email...',
    labels: ['email', 'sales']
  }
];

for (const template of promptTemplates) {
  await axios.post(`${BASE_URL}/prompts`, template, { headers });
}
```

### Programmatic Updates

Update all prompts with a specific label:

```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://<your-api-host>/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Get all marketing prompts
response = requests.get(
    f"{BASE_URL}/prompts",
    headers=headers,
    params={"label": "marketing"}
)
prompts = response.json()["prompts"]

# Add new label to all marketing prompts
for prompt in prompts:
    labels = prompt["labels"] + ["content-creation"]
    requests.put(
        f"{BASE_URL}/prompts/{prompt['slug']}",
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
        https://<your-api-host>/api/v1/prompts \
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
