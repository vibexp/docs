---
title: Email Provider
description: Send your team's invitations, notifications and digests through your own SMTP, Mailgun, Postmark or SendGrid account, from your own address.
---

By default every team's mail is sent by the provider the instance operator
configured. A team can instead bring its own, so mail arrives from an address
your recipients recognise and your own domain reputation.

Configuration is per team, managed entirely in the app, and the credential is
stored encrypted. Nothing is set through server environment variables.

## What it covers

| Sent through your provider | Still sent by the instance provider |
| --- | --- |
| Team invitations | Support requests you submit |
| Notification emails | Support request acknowledgements |
| Daily digests | |

Support mail is deliberately excluded: it goes to the instance operator, not to
your team, so it must not depend on your team's configuration.

## Configure a provider

Open **Teams** → your team → **Settings** → **Email Provider**. Only team
owners and admins can change it; members see the configuration read-only.

Pick a provider type, fill in its fields, add the sender identity, then save.

### SMTP

| Field | Required | Notes |
| --- | --- | --- |
| Host | Yes | Hostname of your SMTP server. |
| Port | Yes | 1 to 65535. Usually 587. |
| Username | No | Leave blank for a server that does not authenticate. |
| SMTP password | On first save | The credential for the username above. |

### Mailgun

| Field | Required | Notes |
| --- | --- | --- |
| Sending domain | Yes | The bare domain, such as `mg.example.com`. Not a URL. |
| API base URL | No | Set for a non-US region, such as `https://api.eu.mailgun.net/v3`. Empty uses the US default. |
| Sending key | On first save | The Mailgun sending key for that domain. |

### Postmark

| Field | Required | Notes |
| --- | --- | --- |
| Message stream | No | Defaults to `outbound`, the default transactional stream. |
| Server token | On first save | The Postmark server's API token. |

### SendGrid

| Field | Required | Notes |
| --- | --- | --- |
| API key | On first save | A SendGrid API key with the "Mail Send" permission. |

## Sender identity

| Field | Required | Notes |
| --- | --- | --- |
| From address | Yes | The address your team's mail is sent from. |
| Display name | No | Shown beside the from address. |
| Reply-To | No | Where replies go, if not the from address. |

:::danger[The from address must be one your provider may send for]
Providers only accept mail for domains you have verified with them. A from
address on any other domain is rejected or hard bounces, and because a broken
provider does not fall back (see below), your team's mail stops. Verify the
domain with your provider first.
:::

## Send a test email

Use **Send test email** before you rely on the configuration. It sends a real
message using **the values currently in the form**, not the saved ones, so you
can check a credential before storing it.

Two things follow from that:

- The test always goes to **your own account address**. You cannot send it
  somewhere else, so this cannot be used to mail third parties.
- You must **re-enter the credential to run a test**, even on a provider that
  already has one saved. The stored credential is never sent back to your
  browser, so there is nothing for the form to reuse.

The result appears inline. A failure reports whether the configuration could
not be built at all (`configuration_invalid`) or was built but delivery failed
(`send_failed`). Testing never saves anything, and a failed test does not stop
you saving.

## Changing a saved provider

The credential is write-only: it is never returned after saving. So the field
is always blank when the page loads, and **leaving it blank keeps the stored
credential**. Enter a value only when you want to replace it.

One exception: if you **change the provider type**, you must enter the new
provider's credential. A team stores a single credential, so keeping the old
one would leave, for example, a Mailgun key being used as an SMTP password.

## When delivery fails

:::caution[A broken provider stops your team's mail. It does not fall back.]
If your provider is configured but failing, VibeXP does **not** quietly send
through the instance provider instead. Your team's mail stops until you fix it.

This is deliberate: silently sending from a different address than the one you
configured would be worse than a visible failure.
:::

The settings page shows the current state:

- **Healthy** with the time of the last successful delivery.
- **Delivery failing** with the last error and when it happened.

The last error is kept for reference after a provider recovers, so a healthy
provider may still display a past failure. Trust the status badge, not the
presence of an error.

## Revert to the instance default

**Revert to instance default** deletes your team's provider and its stored
credential, after a confirmation. Your team's mail then goes back to the
instance provider, and the page returns to showing which address that sends
from.

## Digest volume

The daily digest is sent **per team**. If you belong to several teams you
receive one digest per team rather than a single combined email, because each
team's digest is sent through that team's own provider.

## Related

- [Team roles and permissions](/user-guide/team-roles-and-permissions/)
- [Self-hosting](/user-guide/self-hosting/)
