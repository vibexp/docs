---
title: Metadata filtering
description: Filter artifacts, memories, and blueprints by the metadata your team actually stores, using one JSON query parameter with AND across keys and OR within a key, plus catalog endpoints and MCP tools that let an AI agent discover which keys and values exist.
---

Every artifact, memory, and blueprint carries **metadata**: free-form key/value pairs you (or your AI) attach when the resource is created or imported. Metadata filtering turns that into a query surface, so a team that stamps `env: prod` or `scope: backend` onto its resources can ask for them back.

The same filter works in three places:

- the **REST API**, through a single `metadata` query parameter
- the **web app**, through the metadata filter control on the Artifacts, Memory, and Blueprints list pages
- the **MCP server**, so a connected AI tool can filter without going through the UI

## The `metadata` query parameter

`metadata` takes a **JSON object mapping each key to an array of accepted values**, URL-encoded.

```
GET /api/v1/{team_id}/artifacts?metadata={"env":["prod"]}
```

URL-encoded, which is what an HTTP client actually sends:

```
GET /api/v1/{team_id}/artifacts?metadata=%7B%22env%22%3A%5B%22prod%22%5D%7D
```

It is accepted on:

| Endpoint | Resource |
| --- | --- |
| `GET /api/v1/{team_id}/artifacts` | artifacts |
| `GET /api/v1/{team_id}/artifacts/{project_id}` | artifacts in one project |
| `GET /api/v1/{team_id}/memories` | memories |
| `GET /api/v1/{team_id}/blueprints` | blueprints |
| `GET /api/v1/{team_id}/blueprints/{project_id}` | blueprints in one project |

### Keys are ANDed, values are ORed

Within a key, any listed value matches. Across keys, every key must match.

```json
{"env": ["prod", "staging"], "team": ["backend"]}
```

That reads as: `env` is `prod` **or** `staging`, **and** `team` is `backend`.

### Matching inside arrays

If a resource stores a metadata value as an array, the filter matches **any element** of it. A resource with `{"tags": ["api", "billing"]}` is returned by `{"tags": ["billing"]}`. You do not need to know whether a value was stored as a single string or a list.

### Matching non-string values

Metadata values are compared as they are stored. A filter value that unambiguously reads as a number or a boolean also matches a resource that stored it as one, so `{"version": ["3"]}` matches both `{"version": "3"}` and `{"version": 3}`, and `{"active": ["true"]}` matches both `"true"` and `true`.

### Filtering on presence alone

An **empty array** means "this key exists, whatever its value":

```json
{"env": []}
```

That returns every resource carrying an `env` key. It is the right filter when you want to find resources that have been tagged at all, rather than tagged with something specific.

### Limits

A filter is rejected with `400` if it exceeds any of these:

| Limit | Value |
| --- | --- |
| Keys per filter | 10 |
| Values per key | 25 |
| Key length | 255 characters |
| Value length | 512 characters |

Malformed JSON is also rejected with `400`. The error names the limit that was violated, so a client can correct it.

## Discovering which keys and values exist

Filtering is only useful if you know what to filter on. Two catalog endpoints report the metadata a team is actually using.

**List the distinct keys on a resource type:**

```
GET /api/v1/{team_id}/metadata/keys?resource_type=artifacts
```

**List the distinct values of one key:**

```
GET /api/v1/{team_id}/metadata/values?resource_type=artifacts&key=env
```

`resource_type` is one of `artifacts`, `memories`, or `blueprints`. Both accept an optional `project_id` to narrow to a single project, an optional `q` substring filter, and an optional `limit` (default 100, max 500). Both return a `truncated` flag reporting that more entries exist than were returned.

Results are scoped to your team. One team never sees another team's metadata, even when both use the same key.

In the web app you do not call these directly: the metadata filter control on each list page reads them as you type.

## Over MCP

An AI tool connected to the [MCP server](/user-guide/mcp-server/) has the same two capabilities.

**Filter a listing** by passing `metadata` to `vibexp_io_list_resources`. Because MCP is JSON based, it takes the object directly rather than a URL-encoded string:

```json
{
  "team_id": "your-team",
  "resource_type": "artifact",
  "metadata": {"env": ["prod", "staging"], "team": ["backend"]}
}
```

The semantics are identical to the REST parameter, including the empty-array key-exists form and the limits above.

**Discover keys and values** with `vibexp_io_list_resource_metadata`. Omit `key` to list the distinct metadata keys on a resource type, or supply `key` to list that key's distinct values:

```json
{
  "team_id": "your-team",
  "resource_type": "artifact",
  "key": "env"
}
```

This is what lets an agent build a filter from real keys instead of guessing at them.

## Removed in this release

Three earlier query parameters were **removed** and no longer filter anything. Requests carrying them still succeed, so an old client or a bookmarked URL degrades to an unfiltered list rather than an error. Nothing is silently mis-filtered, but nothing is filtered either.

| Removed | Was used on | Replacement |
| --- | --- | --- |
| `metadata_<key>=value` | artifacts, blueprints | `metadata={"<key>":["value"]}` |
| `metadata_key` + `metadata_value` | memories | `metadata={"<key>":["value"]}` |

The endpoint `GET /api/v1/{team_id}/memories/search` was also removed. It filtered on a single metadata pair, which `GET /api/v1/{team_id}/memories` now does through `metadata`, with more expressive semantics.

If you have scripts or integrations using the old parameters, translate them to `metadata` before upgrading. The new form is strictly more capable: it filters on several keys at once, accepts several values per key, matches inside arrays, and is served by an index, so it is faster on large teams.
