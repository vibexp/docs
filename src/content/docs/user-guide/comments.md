---
title: Comments
description: Team-visible threaded comments on artifacts, memories, prompts, and blueprints, so your team can discuss a resource right where it lives.
---

Comments let your team discuss a resource **in place**. Add a threaded, team-visible comment to an artifact, memory, prompt, or blueprint, and everyone on the team sees it on that resource.

## What you can comment on

Comments attach to four resource types:

- **Artifacts**
- **Memories**
- **Prompts**
- **Blueprints**

Comments are scoped to a team. Every member of the team can read them.

## Who can do what

These rules are specific to comments and are separate from the resource permission matrix in [Team roles & permissions](/user-guide/team-roles-and-permissions).

| Action | Who |
| --- | --- |
| Add a comment | Any team member |
| Edit a comment | The comment's author only |
| Delete a comment | The author, or a team admin or owner |

No role can edit another member's comment. A team admin or owner can delete any comment for moderation, but only the author can change a comment's text.

## Where to find comments

- **Comments panel**: a panel in the sidebar of each resource's detail page, showing that resource's thread newest first. Add a comment from the composer at the top.
- **All comments dialog**: opens the full thread for a resource when it grows past what the panel shows.
- **Recent comments card**: an activity card on the homepage listing the team's latest comment activity, each entry linking back to its resource. An edited comment resurfaces to the top; entries whose resource was deleted drop off.

## REST API only

Comments are a REST API feature. There is **no MCP tool** for comments, so AI assistants connected over the [MCP server](/user-guide/mcp-server) cannot read or post them. Comments are for people, in the web app.
