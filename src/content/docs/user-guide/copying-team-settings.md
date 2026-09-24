---
title: Copying Settings Between Teams
description: Copy artifact types, model providers, and embedding providers from one team into another, what travels with a copy, and the audit log that records every one.
---

Setting a second team up from scratch is tedious: the same artifact types, the
same model provider, the same embedding provider. Since v0.12.0 you can copy
them from a team you already belong to, and every copy is recorded in the
destination team's audit log.

## What can be copied

| Surface | Where | Who can copy |
| --- | --- | --- |
| Custom artifact types | Settings → **Artifact Types** | any member of both teams |
| Model providers | Settings → **Model Providers** | owner or admin of **both** teams |
| Embedding providers | Settings → **Embedding Providers** | owner or admin of **both** teams |

The picker only lists teams you belong to, minus the team you are in, minus any
team where you lack the permission above. If you have no other eligible team,
the copy button is not shown at all.

## Copying

1. Open the settings page for the surface you want.
2. Click **Copy from another team…** (types) or **Copy from…** (providers).
3. Pick the source team.
4. Types copy in one action. For a provider, pick the one to copy, review the
   pre-filled fields (you can override the name, model, endpoint, and the
   tuning fields), then confirm.

A copy is a **snapshot**. Editing or deleting it afterwards has no effect on
the source team, and vice versa.

### Artifact types

All of the source team's custom types are copied in one action. Built-in types
are skipped, since every team already has them, and a type whose slug already
exists in the destination is **skipped rather than overwritten**. The result
tells you how many were added and how many already existed.

### Providers

One provider per copy.

- **The stored API key travels with the copy**, as ciphertext. It is never
  decrypted, never shown, and never appears in a request or response body. The
  copy dialog shows only that it will be copied from the source team.
- A copy always lands **not default**, so it cannot displace the destination
  team's current default provider.
- If the name is already taken, an inherited name is disambiguated to
  `Name (copy)`, `Name (copy 2)`, and so on. A name you type yourself that
  collides is rejected instead, so nothing is renamed behind your back.

:::caution[A copied embedding provider can become the active one]
A team's active embedding provider is the one flagged default, or failing that
the most recently updated one. So if the destination team has **no default
set**, the copy becomes its active provider immediately. If the copy's model
differs from the one it displaced, resources embedded with the previous model
stop matching new queries until they are re-embedded. VibeXP reports this after
the copy — which provider took over and how many resources are affected — and
offers **Re-embed now**. You can also tick **Re-process embeddings after
copying** in the copy dialog beforehand. See
[AI Providers](/user-guide/integrations/ai-providers/).
:::

## The audit log

Settings → **Audit** shows what configuration was copied into this team and by
whom, newest first. Only owners and admins can see it.

Each entry records when, who, which surface, the name of what was copied, the
source team, and whether the copy carried an API key. For artifact types it
lists the slugs that were added. Credentials are never recorded.

The log records copies only: editing or resetting a team's search ranking or
AI Summary settings is not recorded there. AI Summary settings cannot be
copied, and a copied model provider always lands non-default, so it does not
become the team's summary provider until you mark it default or pick it on the
AI Summary card.

The log is append-only: nothing edits or deletes an entry, and there is no
retention window. Entries survive the source team being deleted and the actor's
account being deleted, so a copy stays traceable either way.
