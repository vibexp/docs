---
title: Team roles & permissions
description: Every member of a VibeXP team has a role — Owner, Admin, or Member — and that role decides what they may do. This page is the full matrix, how to change someone's role, and what API keys and MCP agents are allowed to do on your behalf.
---

Every member of a team has exactly one **role**: **Owner**, **Admin**, or **Member**. The role decides what they may do in that team — who can invite people, manage projects, delete other people's work, or delete the team itself.

Roles are **per team**. You can be the Owner of one team and a Member of another; VibeXP works out your permissions separately for each.

## The three roles

| Role | Who it's for |
| --- | --- |
| **Owner** | The person who created the team. Exactly one per team. Can do everything, including deleting the team and handing ownership to someone else. |
| **Admin** | Trusted people who run the team day to day: invite and remove members, manage projects, moderate feeds. They cannot delete the team or transfer ownership. |
| **Member** | Contributors. They create and edit resources, but don't manage the team or its projects. |

### Which role should I give someone?

- **Owner** — leave it with whoever is accountable for the team. There is only ever one, and you change it by [transferring ownership](#transfer-ownership).
- **Admin** — for people you trust to manage others: onboarding new members, tidying projects, moderating feed posts.
- **Member** — the right default for everyone else. Members are not read-only: they can create prompts, memories, artifacts, blueprints and agents, and edit existing ones.

## What each role can do

| | Owner | Admin | Member |
| --- | :---: | :---: | :---: |
| **Team** | | | |
| Change team name, slug, description | ✅ | ✅ | — |
| Delete the team | ✅ | — | — |
| Transfer ownership | ✅ | — | — |
| **Members** | | | |
| Invite new members | ✅ | ✅ | — |
| Remove members | ✅ | ✅ | — |
| Change a member's role | ✅ | ✅ | — |
| **Projects** | | | |
| Create a project | ✅ | ✅ | — |
| Update any project | ✅ | ✅ | — |
| Delete any project | ✅ | ✅ | — |
| **Resources** (prompts, memories, artifacts, blueprints, agents) | | | |
| Create | ✅ | ✅ | ✅ |
| Update *anyone's* | ✅ | ✅ | ✅ |
| Delete their own | ✅ | ✅ | ✅ |
| Delete *someone else's* | ✅ | ✅ | — |
| **Feeds** | | | |
| Post and reply | ✅ | ✅ | ✅ |
| Delete their own post | ✅ | ✅ | ✅ |
| Delete *someone else's* post (moderation) | ✅ | ✅ | — |

Everyone in a team can **view** the team, its members, its projects and all of its resources. Roles only govern what you can *change*.

Two entries surprise people, so they're worth stating plainly:

- **Members can update anyone's resources**, not just their own. VibeXP treats a team's prompts and memories as shared work. If that isn't what you want for a particular group of people, don't put them in the same team.
- **Members hold no project permissions at all.** Projects are containers that Admins and Owners curate; Members work inside them.

## Personal workspaces

Your **personal workspace** is a team like any other, with you as its Owner. Because it isn't shared, the team-management actions that need somebody else — inviting members and transferring ownership — aren't offered, and it cannot be deleted.

## Managing roles

Both actions live on **Settings → Teams → (your team)**.

### Change someone's role

Admins and Owners can switch any member between **Member** and **Admin** using the role dropdown in the members list.

The **Owner's row cannot be changed here** — ownership is not a role you assign, it's one you transfer. People with a pending invitation can't be changed either: they have no membership until they accept.

:::note[Share a pending invitation link]
Admins and Owners can copy a shareable accept link (`/invitations/accept/:token`) for a pending invitation from the members list, to hand it over directly if the invitation email never arrives.
:::

:::caution
You can demote **yourself** from Admin to Member. Nothing stops you, and you cannot undo it — you'd no longer hold the permission to change roles. Ask an Owner or another Admin to promote you back.
:::

### Transfer ownership

The Owner can hand the team to any member who has accepted their invitation, via **Transfer ownership**. It happens in one step:

- the person you choose becomes the **Owner**;
- you become an **Admin**.

You cannot undo this yourself — only the new Owner can transfer it back. There is always exactly one Owner.

## API keys and MCP agents

**An API key acts as the person who created it, with exactly their role.** A request authenticated with your API key can do precisely what you can do — no more, no less. The same applies to AI agents connected over the [MCP server](/user-guide/mcp-server/): they act as the user who authorised them.

So:

- Give a key to an automation that only needs to create resources? Its owner being a **Member** is enough.
- If your key's owner is an **Admin**, anything holding that key can invite members and delete projects. Scope keys to the right person.
- **Demoting someone changes what their keys and agents can do, immediately.** There's no separate permission list to update.

## Permission names in the API

Team payloads from the API carry a `permissions` array listing exactly what *you* may do in that team, computed by the server from your role:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Engineering",
  "role": "admin",
  "permissions": [
    "team.update",
    "member.invite",
    "member.remove",
    "member.role.update",
    "project.create",
    "project.update",
    "project.delete",
    "resource.create",
    "resource.update.any",
    "resource.delete.own",
    "resource.delete.any",
    "feed.delete.any"
  ]
}
```

If you're building against the API, **read this array rather than deriving permissions from `role`** — the server owns the matrix, and reading it keeps you correct if it ever changes.

The complete set of permission strings:

| Permission | Meaning |
| --- | --- |
| `team.update` | Change team name, slug or description |
| `team.delete` | Delete the team |
| `team.transfer` | Transfer ownership to another member |
| `member.invite` | Invite new members |
| `member.remove` | Remove members from the team |
| `member.role.update` | Change a member's role |
| `project.create` | Create a project in the team |
| `project.update` | Update any project in the team |
| `project.delete` | Delete any project in the team |
| `resource.create` | Create a prompt, memory, artifact, blueprint or agent |
| `resource.update.any` | Update any resource, including other members' |
| `resource.delete.own` | Delete a resource you created |
| `resource.delete.any` | Delete a resource created by someone else |
| `feed.delete.any` | Delete another member's feed post (moderation) |

These strings are stable API surface, defined by the `Team.permissions` schema in VibeXP's OpenAPI specification — that spec is the source of truth, and this table is kept identical to it.

## What happens if you try something you can't do

The interface hides actions your role doesn't allow, so mostly you won't meet a wall. If you do — say your role changed while you had the page open — the request is refused by the server and VibeXP tells you that you don't have permission. **The server enforces every one of these rules**; hiding buttons is a convenience, not the boundary.
