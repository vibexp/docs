---
title: Access Analytics
description: See how often each resource is read and where those reads come from, with a compact Access activity chart on every resource detail page.
sidebar:
  order: 8
---

See how often a resource is being read, and where those reads come from, with a compact **Access activity** chart on each resource's detail page.

## Overview

Every time a resource's detail page is opened — whether from the web app, the CLI, an AI tool over MCP, or a direct API call — VibeXP records an **access event**. The Access activity chart turns those events into a simple daily timeline so you can see when a resource is being used and which surface it's being used from.

This is read activity only. It tells you how often something is being *looked at*, not how often it's being edited.

### Where it appears

The Access activity chart is shown on the detail page of each of these resource types:

- **Prompts**
- **Artifacts**
- **Blueprints**
- **Memories**
- **Projects**
- **Agents**

On content pages (prompts, artifacts, blueprints, memories) it sits in the right-hand sidebar. On Projects and Agents it appears near the stat cards. On smaller screens it stacks below the main content.

## Reading the chart

The chart is a stacked bar chart with one bar per day. Each bar is split by **source** so you can see, at a glance, how a resource is being reached.

- **Total accesses** — the headline number above the chart sums every access in the selected time range.
- **Time range** — a selector lets you switch between **Last 7 days**, **Last 14 days**, **Last 30 days**, and **Last 3 months (90 days)**. It defaults to **Last 30 days**.
- **Hover a bar** — a tooltip breaks the day down by source and shows the day's total.
- **No activity yet** — if a resource hasn't been read in the selected range, the chart shows an empty state instead of bars.

## What counts as an access

An access is recorded when a resource's **detail** is successfully read:

- Opening a resource's detail page in the web app.
- Fetching a single resource by the API or CLI (a get-by-id / get-by-slug request that succeeds).
- Reading a resource through its MCP tool — `vibexp_io_get_resource` (for a `memory`, `artifact`, or `blueprint`).

The following are **not** counted:

- **List views.** Browsing the prompts list, artifacts list, etc. does not record an access against any individual resource — only opening a specific resource does.
- **Failed reads.** Only successful reads are recorded. A request that returns "not found" or "forbidden" does not create an access event.
- **Edits, creates, and deletes.** The chart tracks reads, not writes.

## Access sources

Each access is tagged with the surface it came from. There are four sources:

| Source | What it means |
|--------|---------------|
| **Web** | Read from the VibeXP web application (your signed-in browser session). |
| **CLI** | Read by the VibeXP command-line tool. |
| **MCP** | Read by an AI assistant through the [VibeXP MCP server](/user-guide/mcp-server) — for example, when a connected AI tool fetches an artifact or memory. |
| **API** | Read by any other program calling the VibeXP API directly with an [API key](/user-guide/integrations/api-keys). This is the catch-all for programmatic access that isn't the CLI or MCP. |

The source is determined automatically from how the request authenticated — you don't need to configure or send anything to control it. Browser (cookie) sessions are recorded as **Web**; API-key requests are classified as **MCP**, **CLI**, or **API** based on the request.

## Team-wide data

Access activity is aggregated **across your whole team**. The chart for a resource shows reads by *every* member of the team that owns it, not just your own. If three teammates each open the same prompt, that's three accesses on the chart.

This means the chart reflects how valuable a resource is to the team as a whole. (VibeXP records which member made each access internally, but a per-person breakdown is not shown in this view.)

## Data retention

Access events are retained for **90 days by default**. Older activity is automatically removed, so the "Last 3 months" range covers the full retained history on a default deployment. The window is operator-configurable (`retention.access_event_days`, 1 to 3650 days).

## Frequently asked questions

**Why does my chart say "No activity yet"?**
The resource hasn't been opened within the selected time range, or it was only just created. Try a wider range, or check back after it's been read.

**Do my own views count?**
Yes. Opening the detail page yourself records a **Web** access, and it's included in the totals.

**Does browsing the list of prompts (or artifacts, etc.) show up?**
No. Only opening an individual resource's detail page is counted. List and search views are not tracked.

**Will accesses from before today appear?**
Accesses are recorded going forward from when the feature was enabled and are kept for 90 days. The chart can only show activity that has actually been recorded.
