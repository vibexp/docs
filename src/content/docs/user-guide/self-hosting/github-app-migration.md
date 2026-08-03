---
title: Migrating to per-team GitHub Apps
description: Upgrade guide for the release that moves GitHub App credentials out of config.yaml and into per-team settings. Requires a config.yaml edit before the instance will start.
sidebar:
  order: 4
---

:::danger[Read this before you pull the new image]
This release **removes the instance-wide `github:` section from `config.yaml`.**
If you upgrade without deleting that section, the backend **refuses to start**.
:::

GitHub App credentials used to be instance-wide: one App configured in
`config.yaml`, shared by every team on the instance. They are now registered
**per team** and stored encrypted in the database, so each team connects its own
GitHub App to its own organization.

This page is the one-time instance migration. For the per-team setup that
follows it, see [GitHub App](/user-guide/integrations/github-app/).

## What you must do

### 1. Delete the `github:` section from `config.yaml`

**Before:**

```yaml
search:
  recency_ranking_enabled: false

# GitHub App / integration (distinct from the github web-login client above).
github:
  app_id: "123456"
  app_slug: "my-vibexp-app"
  app_private_key: "${GITHUB_APP_PRIVATE_KEY}"
  webhook_url: "https://vibexp.example.com/api/v1/webhooks/github"
  webhook_secret: "${GITHUB_WEBHOOK_SECRET}"
  app_client_id: "Iv1.abc123"
  app_client_secret: "${GITHUB_APP_CLIENT_SECRET}"

storage:
  attachments_bucket: ""
```

**After:**

```yaml
search:
  recency_ranking_enabled: false

storage:
  attachments_bucket: ""
```

If you skip this, startup fails with:

```
config file "/app/config.yaml" declares removed top-level section(s) —
"github": GitHub App credentials are now configured per team in the UI
(open the team, then Settings → GitHub Integration), not instance-wide. Delete
the `github:` section from your config.yaml and re-register the App on each
team. Note this is NOT `auth.github` (the web-login OAuth client), which is
unaffected.
```

The failure is deliberate. Silently ignoring the section would leave you running
on credentials that are no longer read, believing the integration is configured.

:::caution[Do not touch `auth.github`]
`auth.github` is the GitHub **web-login** OAuth client, a different credential
set on a different code path. It is **unaffected** by this release. Only the
**top-level** `github:` section is removed. `GITHUB_CLIENT_SECRET` belongs to
`auth.github` and must stay.
:::

### 2. Remove the unused environment variables

These are no longer read by anything. Leaving them set is harmless but
misleading, so drop them from your compose file, Helm values, or systemd unit:

- `GITHUB_APP_ID`
- `GITHUB_APP_SLUG`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_URL`
- `GITHUB_WEBHOOK_SECRET`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`

Keep `GITHUB_CLIENT_SECRET`; again, that one is the web login.

### 3. Re-register the App on each team

The database migration **deletes every existing GitHub installation row**. That
is what makes the new per-App ownership possible, and it means every team that
used the GitHub integration must set it up again: open the team, then
**Settings** → **GitHub Integration**.

:::tip[You can reuse your existing App]
You do **not** need to create a new GitHub App. Paste the same App ID, slug,
client ID, client secret, and private key you had in `config.yaml` onto whichever
team should own it. VibeXP generates a **fresh webhook secret** and a
**per-App webhook URL** for you to paste back into the App's settings on GitHub.
:::

One caveat: a GitHub App has exactly **one** webhook URL, so an App can be
registered by **one team only**. If several teams need the integration, each
needs its own GitHub App.

### 4. Repoint the webhook and re-connect

Each team's webhook URL now carries a routing token that identifies which App a
delivery belongs to:

```
https://vibexp.example.com/api/v1/webhooks/github/<routing-token>
```

The pre-release endpoints are retired and answer **410 Gone**:

- `POST /api/v1/webhooks/github`
- `POST /api/v1/integrations/github/webhook`

They return 410 rather than redirecting, because both verified deliveries
against the instance-wide secret that no longer exists, and a redirect would land
deliveries on an authentication failure that reads like a secret mismatch. They
will be deleted entirely in a later release.

After repointing the webhook, complete the install from the team's
**Settings** → **GitHub Integration**.

## How much will actually break

Less than the above suggests. The UI connect flow was already failing with
`400 code is required` before this release (the app never relayed GitHub's
OAuth `code` to the callback), so most instances have **no working installation
to lose**. What you are migrating is usually configuration, not a live
integration.

## Reverse proxy and TLS

Each team's webhook URL is public and must be reachable from GitHub. If you
terminate TLS upstream, the same `X-Forwarded-Proto` guidance that applies to
the rest of the deployment applies here. See
[Authentication](/user-guide/self-hosting/authentication/).

:::caution[Your proxy's access log will contain the routing token]
The token sits in the URL path, so any upstream proxy that logs full request
paths records it. VibeXP redacts the token from its own logs and error
responses, but it cannot redact yours. The token is a routing key, not the
signing secret (a leaked token alone cannot forge a delivery, because the
payload signature is still verified against the App's webhook secret), but treat
it as sensitive and scope your log retention accordingly.
:::

## Checklist

- [ ] `github:` section deleted from every `config.yaml` you mount
- [ ] `GITHUB_APP_*` / `GITHUB_WEBHOOK_*` env vars removed from the deployment
- [ ] `auth.github` and `GITHUB_CLIENT_SECRET` left untouched
- [ ] New image starts cleanly
- [ ] Each team re-registered its App under its own Settings → GitHub Integration
- [ ] Each App's webhook URL and secret updated on GitHub
- [ ] Each team re-connected its installation and can list repositories
