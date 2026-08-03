---
title: Upgrading
description: Breaking changes in VibeXP releases and the migration each one needs, newest first. Anything listed here requires action before the new image will start.
---

Most VibeXP releases upgrade in place: pull the new image, restart, done. This
page lists the exceptions.

**Anything below requires action *before* the new image will start.** Each entry
links to a full migration guide with the exact steps. Entries are newest first:
if you are skipping several releases, work upwards from the version you are on
and apply every migration in between.

## Breaking changes

### GitHub App configuration moved to per-team settings

GitHub App credentials used to be instance-wide: one App in `config.yaml`,
shared by every team. They are now registered **per team** and stored encrypted
in the database. You must delete the top-level `github:` section from your
`config.yaml` or the backend refuses to start, drop the `GITHUB_APP_*` /
`GITHUB_WEBHOOK_*` environment variables, and re-register the App on each team
that uses the integration.

This does **not** affect `auth.github`, the GitHub web-login OAuth client.

→ [Migrating to per-team GitHub Apps](/user-guide/self-hosting/github-app-migration/)
