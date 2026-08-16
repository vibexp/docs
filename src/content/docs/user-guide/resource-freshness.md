---
title: Resource Freshness
description: Rules that flag prompts, artifacts, blueprints, and memories nobody has used in a while, so your workspace reflects what the team actually relies on. Covers rules, evaluation, what clears a stale flag, analytics, and the audit trail.
sidebar:
  order: 9
---

Knowledge bases accumulate. Resource Freshness tells you which parts of yours have
gone quiet: your team writes rules like "artifacts nobody has opened in 90 days",
VibeXP evaluates them on a schedule, and matching resources get a **Stale** badge.
Open or edit a stale resource and the flag clears itself.

Freshness covers the four resource types: **prompts**, **artifacts**,
**blueprints**, and **memories**.

## How it works

1. **You write rules.** A rule is a set of criteria: which resource types, which
   project, which kinds of access count, and how many days without one.
2. **VibeXP evaluates them on a schedule.** A background job runs your team's
   rules at the interval you choose (daily by default). No external cron, no
   manual pass.
3. **Matching resources are marked stale.** They get a quiet **Stale** badge in
   the lists and can be filtered with **Stale only**.
4. **Using a resource clears the flag.** Opening or editing a stale resource
   marks it fresh again, unless your team turns that off.

:::note[Freshness starts clean]
There is no backfill from historical access data. Nothing is flagged until access
data accrues *after* your rules exist, so a freshly upgraded workspace shows
nothing stale at first. That is expected, not a bug.
:::

## Where the settings live

Open your team, then **Settings** → **Resource Freshness**
(URL `/teams/<team>/settings/freshness`). The page has three tabs:

| Tab | What it holds |
| --- | --- |
| **Settings** | The evaluation interval, the reversal toggle, and your rules |
| **Analytics** | Charts of what is stale, over time and by type, project, and rule |
| **Audit** | Every mark and every clear, newest first |

Every team member can read all three tabs. Only **Owners** and **Admins** can
change the settings or the rules, which is the `team.settings.update` permission.
See [Team roles and permissions](/user-guide/team-roles-and-permissions/).

## Rules

A rule has no name. A rule *is* its criteria, and the page describes each one back
to you in a sentence such as "Artifacts in Marketing not accessed via the CLI for
90 days".

| Field | What it means |
| --- | --- |
| **Resource types** | One or more of Artifacts, Prompts, Blueprints, Memories. Required |
| **Project** | One project, or **Any project** to cover the whole team |
| **Access mediums** | Which kinds of access keep a resource fresh: Web app, CLI, MCP tools. Select none to count any medium |
| **Threshold (days)** | Days without a qualifying access before the resource is marked stale. 1 to 36500 |
| **Enabled** | Disabled rules are kept but skipped by evaluation runs |

Two defaults are worth remembering because they read like the opposite of what
they are:

- **No project selected means every project in the team**, not "no project".
- **No medium selected means any medium counts**, not "no medium counts".

Rules are evaluated **independently, and staleness is their union**: a resource is
stale if *any* enabled rule matches it. Each rule counts a resource's own
`updated_at` as activity too, so an edit always keeps a resource fresh whatever
mediums the rule names.

Deleting a rule removes it from any resource it flagged. A resource flagged only
by that rule stops being stale.

## Evaluation settings

**Run rules** sets how often your team's rules are evaluated: **Hourly**,
**Every 6 hours**, **Daily** (the default), or **Weekly**. Below the presets, the
minimum is 1 hour and the maximum is 365 days.

**Clear stale flags on use** controls reversal. On by default: opening or editing
a stale resource marks it fresh again. Turn it off and a stale flag survives until
the next scheduled run re-evaluates it.

A team with no saved settings inherits the deployment defaults and shows a
**Using instance defaults** badge. **Reset to defaults** drops your override so
the team inherits again.

The schedule exists while the team has at least one rule. Delete the last rule and
the schedule goes away with it.

## What clears a stale flag

Two things clear a flag, and they behave differently:

**An edit always clears it.** Every rule counts an update as activity, so editing a
resource makes it fresh no matter which mediums the rule watches.

**A read clears it only through a watched medium.** If the rules that flagged a
resource only count CLI access, opening that resource in the web app does *not*
clear the flag. This is deliberate: clearing on an unwatched medium would make the
badge flicker back on at the next run, once per interval, forever. A rule with no
mediums selected is cleared by a read through any medium.

Reads are counted exactly as [Access Analytics](/user-guide/resource-access-analytics/)
counts them: a successful read of a single resource's detail, from the web app,
the CLI, an AI tool over MCP, or a direct API call. Browsing a list does not count.

:::note[Accesses from generic API clients]
VibeXP records four access sources: web, CLI, MCP, and API. The first three can be
selected as rule criteria; **API is recorded but not offered as a rule medium**. A
rule with no mediums selected still counts API reads, since it counts every medium.
:::

## Finding stale resources

A flagged resource carries a quiet **Stale** badge in the prompts, artifacts,
blueprints, and memories lists. Hover it to see when the resource was last used and
how many rules flagged it.

Each of those four lists has a freshness dropdown with **All freshness** and
**Stale only**. On the artifacts, blueprints, and memories lists the choice is kept
in the URL, so `/artifacts?freshness=stale` is a link you can share.

The badge is intentionally understated. Stale is information, not an error: it
means nobody has needed this lately, which is sometimes exactly right.

## Analytics

The **Analytics** tab has one time-range selector (7 days up to 6 months) and four
panels:

- **Stale resources over time**: how many were stale at the end of each day, plus
  how many were marked and cleared that day.
- **Stale by resource type**.
- **Stale by project**.
- **Impact per rule**: which rules are actually doing the flagging.

A resource matched by several rules counts once in the total and once under each
rule, so the per-rule figures can add up to more than the total.

## Audit

The **Audit** tab lists every freshness event, 20 per page, newest first: what
happened to which resource and when. Events read as:

- Marked stale, a rule matched it
- Cleared, someone opened it
- Cleared, someone edited it
- Cleared, no rule matches it any more

Entries link straight to the resource. An entry whose resource has since been
deleted stays in the log as plain text, since the log is append-only history.

The audit trail is visible to every team member on purpose. People only trust
automation they can inspect.

## API

All freshness endpoints are team scoped. Reads are open to any member; every write
needs `team.settings.update`.

| Endpoint | What it does |
| --- | --- |
| `GET /api/v1/{team_id}/freshness/rules` | List the team's rules |
| `POST /api/v1/{team_id}/freshness/rules` | Create a rule |
| `PUT /api/v1/{team_id}/freshness/rules/{rule_id}` | Replace a rule (send every field) |
| `DELETE /api/v1/{team_id}/freshness/rules/{rule_id}` | Delete a rule |
| `GET /api/v1/{team_id}/settings/freshness` | Read the evaluation settings |
| `PUT /api/v1/{team_id}/settings/freshness` | Update the evaluation settings |
| `DELETE /api/v1/{team_id}/settings/freshness` | Reset to the instance defaults |
| `GET /api/v1/{team_id}/freshness/metrics/over-time` | Daily marked, cleared, and stale totals |
| `GET /api/v1/{team_id}/freshness/metrics/by-type` | Stale counts per resource type |
| `GET /api/v1/{team_id}/freshness/metrics/by-project` | Stale counts per project |
| `GET /api/v1/{team_id}/freshness/metrics/by-rule` | Stale counts per rule |
| `GET /api/v1/{team_id}/freshness/audit` | The audit log, paginated |

The metrics endpoints take `range`, one of `7d`, `14d`, `30d`, `60d`, `90d`, or
`180d` (default `30d`).

### Freshness on resource payloads

Prompts, artifacts, blueprints, and memories carry an optional `freshness` object:

```json
{
  "freshness": {
    "status": "stale",
    "since": "2026-05-18T09:14:22Z",
    "matched_rule_ids": ["3f1c8a2e-..."],
    "reason": "rule_run"
  }
}
```

**The field is absent when the resource is fresh.** There is no `is_stale` flag to
check: presence is the answer. `since` is when the resource was *first* marked, so
it survives re-evaluations and is the age to display.

`vibexp_io_get_resource` returns the same object for memories, artifacts, and
blueprints over the [MCP server](/user-guide/mcp-server/).

### Filtering lists

The four list endpoints accept `freshness=stale`:

```bash
GET /api/v1/{team_id}/prompts?freshness=stale
GET /api/v1/{team_id}/artifacts?freshness=stale
GET /api/v1/{team_id}/blueprints?freshness=stale
GET /api/v1/{team_id}/memories?freshness=stale
```

`stale` is the only accepted value; anything else returns a 400 rather than
silently ignoring the filter. The artifacts and blueprints per-project list
endpoints accept it too.

## Good to know

- **Nothing is flagged until you add a rule.** No rules, no staleness.
- **Disabling every rule is not the same as deleting them.** Disabled rules are
  skipped, so the next run clears everything that was stale. Deleting the last
  rule removes the team's schedule entirely.
- **Access-event retention does not limit thresholds.** VibeXP stores each
  resource's last-access time per medium as a field on the resource, so a 180-day
  threshold works even though the detailed access events are pruned after 90 days.
- **This is not the "freshness" in search ranking.** Search ranking has a recency
  weight, also called freshness, that decides result ordering. It is unrelated:
  stale resources are neither hidden nor demoted in search. See
  [Search](/user-guide/search/).

## Self-hosting

Freshness evaluation runs on the backend's in-process scheduler, which is on by
default and needs no external cron. Operators can turn it off instance wide with
`SCHEDULER_ENABLED=false`, which stops all freshness evaluation. See
[Backend configuration](/developer-guide/backend/configuration/).
