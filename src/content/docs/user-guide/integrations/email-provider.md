---
title: Email Provider
description: Send your team's mail through its own SMTP, Mailgun, Postmark, or SendGrid account instead of the instance provider.
sidebar:
  order: 3
---

Each team can bring its own email provider. Invitations, notifications, and
the team's daily digest then go out through the team's account, from the
team's own address, instead of the instance-wide provider.

A team without its own provider **inherits the instance provider**; nothing
breaks and no setup is required. Support mail always uses the instance
provider regardless.

## Configure a provider

Open your team, then **Settings** → **Email Provider** (Owners and Admins
only). Pick a provider type and fill in its settings:

| Provider | Settings | Credential |
| --- | --- | --- |
| **SMTP** | host, port, optional username | SMTP password |
| **Mailgun** | sending domain, optional region base URL | sending key |
| **Postmark** | optional message stream | server token |
| **SendGrid** | _(none)_ | API key with "Mail Send" permission |

Every provider also takes:

- **From address** (required): the address the team's mail is sent from.
- **From name** (optional): display name shown beside the from address.
- **Reply-To** (optional): replies go here instead of the from address.

Use **Send test email** to verify a configuration before saving it: a real
message is sent with the candidate settings to your own account email, and
the outcome is reported without storing anything.

## How credentials are handled

The credential is stored encrypted with the instance's encryption key and is
**never returned by the API**: reads expose only whether one is stored. When
updating a provider, leave the credential field empty to keep the stored
one. Note that rotating the instance's encryption key invalidates stored
team credentials, so each team must re-enter its credential afterward.

## Health and fallback

The page shows whether the last observed send succeeded, with the last
delivery error retained for diagnosis. Deleting the team's provider returns
the team to the instance provider.

## API

The provider is a singleton sub-resource of the team, available under both
`/api/v1/{team_id}/email-provider` (CLI and API clients) and
`/api/v1/{team_id}/settings/email-provider` (the SPA):

- `GET` returns the effective configuration (always 200: a team without its
  own provider reports `source: "instance"` and the instance's
  `effective_from_address`).
- `PUT` creates or replaces the team's provider (idempotent).
- `DELETE` removes it, returning the team to the instance provider.
- `POST .../test` sends a test message with a candidate configuration.

Reads are visible to every team member; writes and the test send require
Owner or Admin.
