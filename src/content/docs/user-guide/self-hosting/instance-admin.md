---
title: Instance Admin Portal
description: Grant instance-wide operators a read-only admin portal on your self-hosted VibeXP for instance stats, users, and teams.
sidebar:
  order: 3
---

The **instance admin portal** gives operators of a self-hosted VibeXP a read-only, instance-wide view of stats, users, and teams. It is meant for whoever runs the deployment, not for day-to-day team collaboration.

## Instance admin vs team roles

An instance admin is an **instance-wide operator role**, separate from the [team roles](/user-guide/team-roles-and-permissions) (owner, admin, member) that govern a single team. A team owner or admin controls one team; an instance admin can view every user and every team on the whole instance, but only in read-only form.

The role is dormant by default: with no instance admins configured, no one has the role and nothing changes for an existing deployment.

## Grant the role

Instance admins are matched by email, **case-insensitive**. Configure them one of two ways:

- **Config file**: set `auth.instance_admins` to a YAML list of emails in `config.yaml`.
- **Docker env var**: set `INSTANCE_ADMIN_EMAILS` to a comma-separated list of emails. The shipped `config.docker.yaml` wires this in as `instance_admins: "${INSTANCE_ADMIN_EMAILS:-}"`.

```yaml
# config.yaml
auth:
  instance_admins:
    - alice@example.com
    - bob@example.com
```

```bash
# Docker
INSTANCE_ADMIN_EMAILS=alice@example.com,bob@example.com
```

See [Authentication & MCP Auth](/user-guide/self-hosting/authentication) for how login is configured, and the [Configuration reference](/developer-guide/deployment/configuration-reference) for all config options.

## What it unlocks

Instance admins get an **`/admin` portal** in the web app, reachable from the **Admin Portal** entry in the user menu. Every view is read-only:

- **Stats dashboard**: instance-wide counts (users, teams, prompts, artifacts, memories) and the running backend version.
- **Users**: a list of all users with their team counts, and a detail view showing each user's team memberships and role per team.
- **Teams**: a list of all teams with owner and member count, and a detail view showing the owner and full member list.

All admin endpoints are `GET` requests. The portal cannot change any data.

## Not advertised to non-admins

The portal is invisible unless you hold the role:

- The `/api/v1/admin` API returns **404 (Not Found)**, not 403, to non-admins and unauthenticated callers, so the surface is never advertised.
- The **Admin Portal** menu entry appears only for instance admins.
- The `is_instance_admin` flag is exposed on `GET /auth/me`, and the web app uses it to show the entry and guard the routes.
