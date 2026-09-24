---
title: Search
description: VibeXP has two searches, semantic resource search across prompts, artifacts, blueprints and memories, and keyword workspace search over teams and projects. This page covers both, plus AI Summary answers, the per-team ranking profile, how teams inherit the instance defaults, and the pagination cap operators own.
---

VibeXP's search blends two things: **how well a resource matches your query** (relevance) and **how recently it was created or updated** (freshness). How those two are weighed is a **per-team setting**, so a fast-moving team can favour fresh context while another keeps strict relevance ordering, in the same deployment.

:::note[Not the same as Resource Freshness]
"Freshness" on this page means how recently a resource was created or updated, and it is only a ranking input. It is unrelated to [Resource Freshness](/user-guide/resource-freshness/), the per-team rules that flag resources nobody has used lately as **stale**. Stale resources are neither hidden nor demoted in search: search results carry no freshness field, and search has no stale filter.
:::

## Two kinds of search

| | Resource search | Workspace search |
| --- | --- | --- |
| **Covers** | Prompts, artifacts, blueprints, memories | Teams and projects |
| **How it matches** | Semantic when the team has an embedding provider, keyword otherwise | Always keyword |
| **Reachable from** | The web app, `vibexp_io_search`, `POST /api/v1/{team_id}/search` | The `vibexp_io_list_teams_and_projects` MCP tool only |
| **Ranking profile applies** | Yes | No |

Everything else on this page is about **resource search**. The ranking profile below tunes it and does not touch workspace search.

:::note[New resources take a moment to become semantically searchable]
Embeddings are generated asynchronously after a resource is saved, so a brand new prompt or memory is findable by keyword straight away and joins semantic results a little later. If something never turns up, the **Pending** count on **Settings** → **Embedding Providers** is the signal. See [Embedding & Model Providers](/user-guide/integrations/ai-providers/).
:::

### Workspace search

Workspace search answers "which team holds the project called X". It is **MCP only**: the `vibexp_io_list_teams_and_projects` tool is the single way to reach it. There is no REST endpoint and no web-app equivalent (the search box on the projects list is an unrelated substring filter over one team's project names, descriptions, and slugs).

Teams and projects are **not embedded**, so this search is keyword only. What each entity matches:

| Entity | Matched exactly | Matched by full text | Typo tolerant |
| --- | --- | --- | --- |
| **Team** | slug, UUID | name, description | name |
| **Project** | slug, UUID, git URL | name, description | name |

A git URL is **exact-match only** and is never full-text indexed, so pasting a clone URL finds the project while a single word from that URL does not.

Matching runs as a four-rung ladder that **stops at the first rung returning rows**, so a precise query never has looser matches appended to it:

| Rung | What it matches |
| --- | --- |
| **Exact** | slug, UUID, or a project's git URL. Score 1.0 |
| **Strict full text** | `websearch_to_tsquery`, so `"quoted phrases"`, `OR` and `-excluded` all work |
| **Relaxed full text** | the same words OR-joined, for natural-language queries that AND to nothing |
| **Trigram** | similarity against the name (threshold 0.3). This is what tolerates typos and what matches slash or hyphen heavy names such as `shaharia-lab/games-for-agents` |

**Membership is enforced on every rung, inside the query**, so searching across all your teams at once is safe. A team or project you don't belong to can never appear.

Arguments:

| Argument | Meaning |
| --- | --- |
| `query` | The search text. A blank query returns **nothing**, not everything |
| `team_id` | Optional team UUID or slug, narrows the search to one team |
| `scope` | `teams`, `projects`, or `both` (default `both`) |
| `page`, `limit` | `limit` defaults to 10 and caps at 25 **per entity type**. Paging reaches at most 100 results |

With no `query` the tool lists the teams you belong to with their project counts, which is the orientation call an agent makes first. Project descriptions in the response are truncated to 160 characters.

:::note[Self-hosters]
Workspace search uses Postgres full-text search plus the `pg_trgm` extension, which an earlier migration already installs. Upgrading adds four indexes and needs no operator action.
:::

## Where the setting lives

Open your team, then **Settings → Search** (URL `/teams/<team>/settings/search`).

Who may change it:

| Role | Can do |
| --- | --- |
| **Owner**, **Admin** | Change the ranking profile and reset it to the instance defaults |
| **Member** | View the effective settings, read-only |

This is the `team.settings.update` permission; see [Team roles and permissions](/user-guide/team-roles-and-permissions/). The server enforces it on every write; a read-only view is a convenience, not the boundary.

## The three presets

Most teams should pick a preset and move on. A preset is just a shorthand for the underlying numbers; there is no hidden "preset" state, so a profile stays readable and editable either way.

| Preset | Recency ranking | Relevance | Created | Updated | Half-life |
| --- | :---: | :---: | :---: | :---: | :---: |
| **Relevance only** | off | n/a | n/a | n/a | n/a |
| **Balanced** | on | 0.5 | 0.3 | 0.2 | 90 days |
| **Favor recent** | on | 0.3 | 0.4 | 0.3 | 30 days |

- **Relevance only**: order purely by how well a resource matches the query. Age is ignored. This *is* "recency ranking off", which is why there is no separate on/off switch.
- **Balanced**: mostly relevance, with a nudge toward fresher resources. A good default for most teams.
- **Favor recent**: weight freshness heavily and decay it faster. Suits fast-moving workspaces where stale context misleads more than it helps.

If your values match none of the three, the page shows **Custom**. That is a normal state, not an error: it is what you get after tuning anything in **Advanced**.

## Advanced: the raw numbers

The **Advanced** section exposes the four values the presets write:

| Value | What it does |
| --- | --- |
| `rank_weight_relevance` | Weight of semantic/keyword relevance. Normally the dominant one. |
| `rank_weight_created` | Weight of how recently the resource was created. |
| `rank_weight_updated` | Weight of how recently the resource was updated. |
| `rank_half_life_days` | Freshness decay half-life. A resource exactly this old scores half its freshness. |

Two things worth knowing before you tune:

- **The three weights are normalized by their sum**, so only their *ratio* matters. `0.5 / 0.3 / 0.2` and `5 / 3 / 2` behave identically; they need not add up to 1.
- **Freshness decays exponentially.** With a 90-day half-life, something 90 days old scores 0.5 on freshness, 180 days old scores 0.25, and so on. Shorter half-life = a sharper preference for new work.

Weights must be non-negative and not all zero, and the half-life must be greater than 0 and at most 36500 days.

## Inheriting the instance defaults

A team either has **its own complete profile** or **none at all**; there is no per-field blend.

- **No override**: the team inherits the deployment's defaults, and the page shows a **Using instance defaults** badge. If an operator changes those defaults, the team follows along.
- **Its own profile**: the team's saved values apply, and operator changes to the defaults no longer affect it.

**Reset to defaults** drops the team's profile so it inherits again. Note that it returns you to whatever the instance default *is at that moment*, not to whatever it was when you first overrode it.

## Pagination is capped while recency ranking is on

This one surprises people, so it is worth stating plainly.

When recency ranking is enabled, VibeXP pulls the top matches by relevance and **re-ranks that pool in memory**. The pool size is the instance's **candidate cap** (200 by default). Results outside it are never re-ranked and are **not reachable by paging further**, so the reported result count is clamped to the size of that pool. If your query matches more than the cap, you will see exactly the cap's worth of results and no more.

With recency ranking **off**, none of this applies: pagination runs against the full result set as usual.

The Search Settings page shows your deployment's actual cap in the Advanced section. If you need to page deeper than that, either narrow the query or ask your operator to raise the cap.

**The candidate cap is not team-configurable.** It is the one search knob that stays instance-only, because raising it increases memory and latency for *every* query on the deployment; one team must not be able to spend the whole instance's budget. Operators: see [Backend configuration](/developer-guide/backend/configuration/).

## AI Summary

AI Summary answers a search query in a few sentences, grounded in your team's
top results and citing each one as `[1]`, `[2]`, and so on. The answer is
generated by one of your team's own
[model providers](/user-guide/integrations/ai-providers/#model-providers), so
it needs one configured first.

### Where it appears

- **Search results page**: an **AI Summary** section above the results,
  shown once a search returns at least one result. It is collapsed by default
  and makes no request while collapsed. Expanding it generates the summary once
  for the current search, and the page remembers whether you left it open.
  Each `[n]` citation jumps to that result when it is on the current page and
  opens the resource otherwise. A **Sources** list, marking any source that was
  **(truncated)**, and a **Generated by** line naming the model follow the
  answer. On an error, **Retry** asks again.
- **Header search**: a compact, collapsed **AI Summary** row in the search
  dialog. Nothing is generated while you type, only when you expand the row.
  **See full results** opens the search page with the summary expanded and
  reuses the same answer instead of generating it again.

If the team has no model provider, owners and admins see a **Configure a model
provider to enable AI Summary** link instead, and members see nothing. If the
team has turned the feature off, the section is hidden.

### What the model sees

- The **top N results** of the same search you ran (default 5), always from
  the first page, so paging never changes the answer. Type and project filters
  apply.
- The full text of each result, truncated to a per-document budget, and no more
  documents once a total context budget is used. Only the documents actually
  sent are listed as sources, each flagged when it was truncated.
- It works the same whether the search ran semantically or fell back to
  keyword matching, and the team's ranking profile decides which results are
  on top.

When the documents do not contain the answer, the summary says so. Every
summary is one completion request to your provider, billed to that provider.

### Team settings

Open **Settings → Model Providers**; the **AI Summary** card sits below the
provider list.

| Setting | Meaning |
| --- | --- |
| **Enable AI Summary** | Turns the feature on or off for the team, independent of whether a provider exists |
| **Provider** | Which of the team's model providers to use. **Team default** uses the default provider |
| **Results to read** | How many top results to summarize, from 1 up to the instance cap (10 at most) |
| **Style** | **Concise** (at most three sentences), **Balanced** (a short paragraph or a few bullets, the default), or **Detailed** (every relevant point) |
| **Response length (tokens)** | Maximum tokens the answer may use, up to the instance ceiling (4096 by default) |

The summary uses the model configured on the chosen provider, and never falls
back to another provider when that one fails. As with the
ranking profile, a team either owns a complete profile or inherits the instance
defaults: the card shows **Using instance defaults** or **Customized for this
team**, and **Reset to defaults** drops the override. Deleting the chosen
provider falls the team back to **Team default**.

Every member can read the settings and use AI Summary. Changing or resetting
the settings needs the `team.settings.update` permission (owners and admins).

### API

```bash
POST           /api/v1/{team_id}/search/summary
GET|PUT|DELETE /api/v1/{team_id}/settings/ai-summary
```

`POST /search/summary` takes `query` (1 to 1000 characters) plus the optional
`types` and `project_id` filters of regular search, and no paging. It returns
the markdown `summary`, the `sources` in citation order, the `model` and
`provider_id` that answered, `generated_at`, and token `usage` when the
provider reports it. The REST search response also carries an `ai_summary`
object (`available`, `enabled`) so a client knows whether to offer a summary;
the MCP and CLI search surfaces do not.

| Status | Code | Meaning |
| --- | --- | --- |
| `409` | `AI_SUMMARY_DISABLED` | AI Summary is off for the team |
| `409` | `AI_SUMMARY_NO_PROVIDER` | The team has no model provider, or uses **Team default** with no provider marked default |
| `422` | `AI_SUMMARY_NO_RESULTS` | The search found nothing to summarize |
| `502` | `AI_SUMMARY_PROVIDER_UNREACHABLE`, `AI_SUMMARY_UNAUTHORIZED`, `AI_SUMMARY_MODEL_ERROR` | The provider could not be reached, rejected the key, or rejected the request |
| `504` | `AI_SUMMARY_TIMEOUT` | The provider did not answer in time |

Errors never include the provider's raw response.

`PUT /settings/ai-summary` replaces the whole profile (`enabled`,
`model_provider_id`, `top_n`, `style`, `max_output_tokens`; there is no partial
update) and returns `400` for a value outside the instance caps or a provider
from another team. `DELETE` resets to the instance defaults and returns `204`.

:::note[Operators]
AI Summary is on by default for every team with a model provider. The instance
`ai_summary` block sets the team defaults, the caps a team cannot raise, the
context budgets, and the request timeout. `AI_SUMMARY_ENABLED=false` changes the
default for teams that have not saved their own settings; a team that saved a
profile with AI Summary on keeps it on. See
[Backend configuration](/developer-guide/backend/configuration/#ai-summary).
:::

## It applies to your AI tools too

A team's ranking profile is **not** a web-app preference. The web app, the [MCP server](/user-guide/mcp-server/), and the CLI all go through one search entry point, so the profile applies identically to every MCP-connected agent searching that team's workspace.

That is usually what you want: an agent asking "what do we know about X" gets the same ordering a teammate would. But it means changing the profile changes what your autonomous agents retrieve, not just what you see on screen.
