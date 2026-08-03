---
title: GitHub App
description: Connect your team's own GitHub App to VibeXP. Create the App, grant the right permissions and events, paste the credentials, wire the webhook, and troubleshoot a setup that is not receiving events.
sidebar:
  order: 3
---

Each team brings its own GitHub App. The App is registered on the team itself
(open the team, then **Settings** → **GitHub Integration**), its credentials are
stored encrypted, and nothing is configured through server environment
variables.

:::note[This is a team setting, not a personal one]
The GitHub App belongs to a team, so it lives under that team's settings, not
the personal **Settings** in the main navigation. If you cannot find it, check
you are looking at the team rather than your own account.
:::

Upgrading an existing instance from the old instance-wide configuration? Start
with
[Migrating to per-team GitHub Apps](/user-guide/self-hosting/github-app-migration/).

## The setup order matters

There is one genuine trap in this flow. You need VibeXP's **webhook URL** while
configuring the App on GitHub, but that URL contains a routing token VibeXP
only mints once you have saved the credentials. A GitHub App's webhook can be
edited after creation, so the working order is:

1. Create the App on GitHub, leaving the webhook blank.
2. Paste the credentials into VibeXP and save.
3. VibeXP shows you the webhook URL **and the webhook secret it generated**,
   once.
4. Go back to the App on GitHub and fill both in.
5. Return to VibeXP and click **Verify**.

Do not stop after step 2. Credentials saved with the webhook unwired **looks
completely fine** in the UI and silently drops every installation event.

## 1. Create the GitHub App

Go to **GitHub** → **Settings** → **Developer settings** → **GitHub Apps** →
**New GitHub App**.

- For an App owned by **you**: `https://github.com/settings/apps/new`
- For an App owned by an **organization**:
  `https://github.com/organizations/<org>/settings/apps/new`

Own the App at the **organization** level when the repositories belong to an
org. An App owned by a personal account keeps working only as long as that
account does.

:::note[If your org restricts App creation]
Organization owners can limit who may create GitHub Apps. If the "New GitHub
App" page is unavailable for the org, either ask an owner to create the App and
hand you the credentials, or create it under a personal account and install it
on the org (installation is a separate permission from creation).
:::

Fill in a name and homepage URL, then leave the **Webhook URL** blank for now;
you will come back for it in step 3.

### Permissions

Grant exactly these **repository** permissions:

| Permission | Access | Why VibeXP needs it |
| --- | --- | --- |
| **Contents** | Read-only | Reads blueprint and configuration files out of your repositories when importing. This is the permission that makes the integration do anything. |
| **Metadata** | Read-only | Mandatory for every GitHub App; it is what lets the App list the repositories an installation can see. GitHub selects it automatically. |

Nothing else. If you are ever asked to grant write access, something is wrong:
VibeXP never writes to your repositories through this App.

### Events

Subscribe to:

| Event | Why |
| --- | --- |
| **Installation** | Tells VibeXP when the App is installed, uninstalled, or suspended, so a team's connection state stays accurate without polling. |
| **Installation repositories** | Tells VibeXP when repositories are added to or removed from an existing installation. |

### User authorization

Enable **"Request user authorization (OAuth) during installation."**

This is not optional. When someone connects an installation to a team, VibeXP
exchanges the authorization code GitHub returns for a *user* token and checks
that this person can actually administer that installation. Without it, the
connect step fails closed rather than trusting the request.

## 2. Paste the credentials into VibeXP

From the App's settings page on GitHub, copy these five values into the team's
**Settings** → **GitHub Integration**:

| Field | Where to find it on GitHub |
| --- | --- |
| **App ID** | The numeric ID at the top of the App's General page. |
| **App slug** | The last path segment of the App's public URL (`github.com/apps/<slug>`). |
| **Client ID** | On the General page, under "Client ID". Not a secret. |
| **Client secret** | Generate one on the General page; shown once by GitHub. |
| **Private key** | Generate a key on the General page; GitHub downloads a `.pem` file. Paste its contents. |

The private key is accepted as **raw PEM** (paste the `.pem` file contents
directly) or **base64-encoded**, useful if you already keep it base64 from an
older configuration. Both work; you do not need to convert anything.

VibeXP validates the credentials against GitHub before saving, so a typo is
caught here rather than at install time.

## 3. Wire the webhook

Saving returns two values, shown **once**:

- the **webhook URL**, which contains a routing token unique to this App
- the **webhook secret**, generated by VibeXP

Copy both into the App's **Webhook** settings on GitHub (URL, and secret), then
click **Verify** back in VibeXP.

:::caution[The webhook secret is shown once]
VibeXP never displays it again; later reads only tell you whether one is set.
If you lose it before pasting it into GitHub, rotate the secret to get a new
one; there is no way to read the old one back.
:::

## 4. Install and connect

Once the App is registered and verified, use **Install on GitHub** to install it
on the account or organization whose repositories you want, choose the
repositories, and complete the redirect back to VibeXP.

The team can now list and import from those repositories.

## Rotating the webhook URL

Rotating mints a new routing token, which changes the webhook URL.

**Deliveries stop until you update the URL on GitHub.** Rotate when you have
reason to believe the URL leaked (for example it appeared in a shared log
export or a support ticket), and update GitHub immediately afterwards.

Rotating the **webhook secret** is the separate recovery path for a secret you
lost before pasting it in. Same rule: update GitHub, or signature verification
fails on every delivery.

## Troubleshooting

### Validation errors when saving credentials

| What you see | What it means | Fix |
| --- | --- | --- |
| **Invalid credentials** | The private key does not belong to the App ID, or the key is unusable. | Re-copy the App ID; generate a fresh private key on GitHub and paste the new `.pem`. |
| **App not found** | GitHub has no App with that ID, or the key authenticates a different one. | Check the App ID against the App's General page. |
| **Slug mismatch** | The credentials are valid, but the slug you entered is not this App's slug. | Copy the slug from the App's public URL (`github.com/apps/<slug>`), not the display name. |
| **Insufficient permissions** | The App lacks a required permission. | Add the missing permission (see [Permissions](#permissions)), then re-run Verify. Existing installations must accept the new permission on GitHub before it takes effect. |
| **Connection failed** | VibeXP could not reach GitHub. | Check outbound network access and any egress proxy from the VibeXP instance. |

### "This team has no GitHub App configured"

The team is trying to install or complete a connection before registering an
App. Register the App first: the install link is built from *your* App's slug,
so there is nothing to link to until it exists.

### No events are arriving

Almost always an unfinished step 3. Work through it in order:

1. **Is the webhook URL on GitHub the one VibeXP gave you?** Compare it against
   the URL shown on the GitHub settings page in VibeXP. A rotation that was
   never copied over is the usual cause.
2. **Check the App's "Recent Deliveries" tab on GitHub.** It shows the response
   VibeXP returned for each attempt, which tells you which of the following it
   is:
   - **404**: the routing token is wrong or stale. Re-copy the webhook URL.
   - **401**: the webhook secret on GitHub does not match. Rotate the secret in
     VibeXP and paste the new one.
   - **410**: you are still posting to a retired endpoint
     (`/api/v1/webhooks/github` or `/api/v1/integrations/github/webhook`). Use
     the per-App URL.
   - **No delivery attempts at all**: the App is not subscribed to the events,
     or the webhook is disabled on GitHub.
3. **Is the URL reachable from GitHub?** It must be publicly resolvable and
   TLS-terminated. Self-hosters behind a proxy should confirm
   `X-Forwarded-Proto` is being forwarded. See
   [Authentication](/user-guide/self-hosting/authentication/).

### Signature verification failures

The webhook secret on GitHub does not match the one VibeXP holds. Because the
secret is never readable after its one disclosure, the fix is always to rotate
it in VibeXP and paste the new value into GitHub, not to try to recover the old
one.

## Who can do this

Registering, editing, rotating, and deleting a team's GitHub App is an
**owner/admin** action, as is starting an installation. Members see the
configuration but cannot change it.
