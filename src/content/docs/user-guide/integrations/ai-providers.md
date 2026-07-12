---
title: Embedding & Model Providers
description: Configure per-team embedding providers for semantic search and bring-your-own OpenAI-compatible model providers.
sidebar:
  order: 2
---

Each team brings its own AI endpoints. Two provider types are configured under
**Settings** → **Integration**:

- **Embedding Providers** power semantic search across prompts, artifacts,
  blueprints, and memories.
- **Model Providers** register OpenAI-compatible LLM endpoints for the team.

Both are team-scoped, managed entirely in the app, and store API keys
encrypted. Nothing is configured through server environment variables.

## Embedding providers

An embedding provider is any OpenAI-compatible `/v1/embeddings` endpoint:
OpenAI, Ollama, LocalAI, vLLM, HuggingFace TEI, and similar.

### Adding a provider

1. Open **Settings** → **Integration** → **Embedding Providers**
2. Click to add a provider and fill in:

| Field | Default | Purpose |
| --- | --- | --- |
| Base URL, API key, provider type | _(required)_ | The endpoint to call. The key is stored encrypted. |
| Model | _(required)_ | The embedding model id. Tagged on every vector and used as the search filter. |
| Chunk size | 1000 | How much text goes into each embedding chunk. |
| Chunk overlap | 200 | Overlap between chunks (must be smaller than the chunk size). |
| Concurrency | 1 | Max concurrent embedding requests sent to this provider. |
| Query / document prefix | _(empty)_ | Optional instruction prefixes for asymmetric models (mxbai, BGE, E5). |

3. Save. The provider is **validated on save**: VibeXP calls the endpoint and
   requires **1024-dimension** vectors. The vector width is fixed and not
   configurable, so pick a model that outputs (or can be asked for) 1024
   dimensions.

Once saved, embedding starts automatically for the team's existing content.

### Coverage, reprocess, and clear

The Embedding Providers page shows **coverage cards**: how much of the team's
content is embedded, pending, or failed. Two actions are available:

- **Reprocess pending**: re-enqueue anything not yet embedded.
- **Clear all embeddings**: delete every stored vector for the team. Content
  is untouched; embeddings are rebuilt on the next processing pass.

:::caution[Changing a provider re-embeds everything]
Changing a provider's identity (endpoint or model) wipes that team's vectors
and re-embeds all content, so the search index stays consistent. Expect a
re-embedding pass after such a change. Editing only chunk sizing, concurrency,
or prefixes fills gaps instead of wiping.
:::

### Without a provider

Everything still works: content saves normally and search falls back to
keyword (full-text) mode, which includes typo tolerance. Only semantic search
is unavailable.

## Model providers

Model providers let a team bring its own OpenAI-compatible LLM endpoint.

1. Open **Settings** → **Integration** → **Model Providers**
2. Add the endpoint URL, API key, and model details
3. Save. The provider's connectivity is **validated on save**.

API keys are stored encrypted and can be updated or removed anytime.

## API access

Both provider types have team-scoped REST endpoints:

```bash
# Embedding providers
GET|POST   /api/v1/{team_id}/settings/embedding-providers
GET|PUT|DELETE /api/v1/{team_id}/settings/embedding-providers/{id}
POST       /api/v1/{team_id}/settings/embedding-providers/validate
GET        /api/v1/{team_id}/settings/embedding-providers/coverage
POST       /api/v1/{team_id}/settings/embedding-providers/{id}/reprocess
DELETE     /api/v1/{team_id}/settings/embedding-providers/embeddings

# Model providers
GET|POST   /api/v1/{team_id}/settings/model-providers
GET|PUT|DELETE /api/v1/{team_id}/settings/model-providers/{id}
POST       /api/v1/{team_id}/settings/model-providers/validate
```

See [API Keys](/user-guide/integrations/api-keys) for authentication.

## Related

- [Memory](/user-guide/memory) and [Artifacts](/user-guide/artifacts) explain
  how semantic search is used day to day.
- Self-hosters: see
  [Self-Hosting → Search and embeddings](/user-guide/self-hosting/#search-and-embeddings).
