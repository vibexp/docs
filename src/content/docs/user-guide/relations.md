---
title: Relations
description: Relations are typed, directional links between your prompts, blueprints, memories, and artifacts, building a shared knowledge graph your AI and your team can navigate.
---

Relations are **typed, directional links between resources**. They connect the four resource types ([artifacts](/user-guide/artifacts/), [memories](/user-guide/memory/), [prompts](/user-guide/prompts/), and [blueprints](/user-guide/blueprints/)) into a shared knowledge graph, so a resource carries the context of everything it was built from, governed by, or explained by. Every edge compounds for the whole team.

Alongside these typed links, VibeXP also computes a lightweight **similar** signal (resources that are semantically close) so related work surfaces even before anyone links it.

## The four relation types

Each relation names the intent an edge carries. The relation type fixes what the target (the other end) must be:

| Relation type | Meaning | Target must be |
| --- | --- | --- |
| `governed-by` | The resource is governed by a blueprint (rules the AI follows) | blueprint |
| `built-from` | The resource was built from a prompt | prompt |
| `explained-by` | The resource is explained by a memory | memory |
| `supersedes` | The resource replaces an older resource of the same type | same type as the resource |

Relations are directional. `supersedes` runs from the newer resource to the older one it replaces.

## Suggested vs confirmed

Every relation has a **status** (`suggested` or `confirmed`) and an **origin** (`human` or `ai`). The status reflects how much VibeXP trusts the edge:

- **Human-created relations are always confirmed.** When you add a relation yourself, it is trusted immediately.
- **AI-created relations use tiered trust.** The low-risk `built-from` and `explained-by` edges are auto-confirmed. The higher-stakes `governed-by` and `supersedes` edges are created as `suggested` and wait for a person to confirm them.

This keeps provenance and context flowing automatically while giving humans the final say on the edges that carry the most weight.

## Where you see relations

Each resource detail page (blueprint, prompt, artifact, and memory) has a **Relations panel**. It shows the resource's related resources, up to 20, in both directions, newest first. From the panel you can:

- **Add a relation** by picking a relation type and a target. The picker only offers targets the relation type allows.
- **Accept or Dismiss AI suggestions.** Suggested edges carry an **AI suggested** badge. Accept confirms the edge; Dismiss removes it.

### Who can do what

- Any team member can **add** a relation.
- **Accepting or dismissing** another user's suggestion requires an admin or owner role.

See [Team Roles and Permissions](/user-guide/team-roles-and-permissions/) for the full breakdown.

## Similar resources

Separate from typed relations, VibeXP computes up to **five similar resources** for a resource each time it is read. Similarity is based on embedding closeness (semantic meaning), not on any link you create, so nothing is stored as an edge.

Today this signal is available to AI tools through the VibeXP API and the MCP resource reads (see [MCP Server Integration](/user-guide/mcp-server/)). It surfaces semantically related work even where no one has drawn a typed relation yet.

## Automatic seeding

To give the graph a head start, VibeXP can seed an initial set of AI-suggested relations across your existing resources. This is a one-time, background cold-start backfill driven by embedding similarity:

- **Cross-type near-matches** become typed suggestions (for example, an artifact close to a blueprint becomes a `governed-by` suggestion).
- **Same-type near-duplicates** become `supersedes` suggestions, with the newer resource superseding the older one.

Because these are AI-proposed, the higher-stakes suggestions wait for a human to confirm them in the Relations panel.

## Linking from your AI tools

AI tools connected over MCP can create relations directly with the `link_resources` tool, so a resource's neighborhood grows as your assistant works rather than only when you link things by hand. See [MCP Server Integration](/user-guide/mcp-server/) for details.
