---
title: AI Agents (A2A)
description: Connect A2A-compatible AI agents to VibeXP, chat with them, and track task execution in real time.
sidebar:
  order: 7
---

Connect AI agents to VibeXP using the Agent-to-Agent (A2A) protocol. Add any
A2A-compatible agent, chat with it, and track task execution in real time.

## Overview

A2A is an open standard for communicating with AI agents. VibeXP speaks A2A
through the official `a2a-go` SDK and supports protocol v1.0, with automatic
negotiation down to v0.3 for older agents.

What VibeXP handles for you:

- **Discovery**: fetches and validates the agent card
- **Invocation**: sends tasks, synchronous or streaming
- **Live updates**: streams status and results while the agent works
- **Cancellation**: stop a running task from the chat
- **Conversations**: multi-turn chats with full context

## Adding an agent

Agents belong to a team. To add one:

1. Open **Agents** in the sidebar
2. Click **Add agent**
3. Enter the agent's **base URL** (for example `https://your-agent-domain.com`)
4. Wait for the agent card preview to load
5. Choose the initial status: **Active** or **Paused**
6. Click **Create agent**

VibeXP discovers the agent card at
`<base URL>/.well-known/agent-card.json`. The agent's name, description,
version, skills, and capabilities all come from the card. You do not enter
them manually.

Notes:

- The card must be served from exactly `/.well-known/agent-card.json` over
  HTTP or HTTPS, and must be 1 MB or smaller.
- The base URL cannot be changed after creation. Delete and re-add the agent
  to point at a new URL.
- The number of agents per team is bounded by your plan's resource limit.
- Agents cannot be moved between teams.

### Host restrictions

In production, VibeXP refuses agent URLs that resolve to loopback, private,
link-local, or cloud-metadata addresses. In local development these hosts are
allowed, so you can test against an agent running on `localhost`.

## The agent card

The agent detail page renders the card as declared by the agent:

- **Interfaces**: A2A v1.0 cards list `supportedInterfaces`, each with a URL,
  protocol binding (JSON-RPC or REST), and protocol version. VibeXP uses the
  primary interface.
- **Streaming**: whether the agent supports streaming updates
  (`capabilities.streaming`).
- **Skills**: the agent's declared skills with tags.
- **Input and output modes**: the content types the agent accepts and returns.

## Credentials

If the agent card declares `securitySchemes`, a credentials editor appears
when you edit the agent. Two credential types are supported:

| Type | Meaning |
| --- | --- |
| `apiKey` | A key sent in a header, query parameter, or cookie, as the card specifies. Keys sent in the `Authorization` header get a `Bearer ` prefix automatically. |
| `http` | HTTP authentication via the `Authorization` header, Basic or Bearer. |

Other schemes (`oauth2`, `openIdConnect`, `mutualTLS`) are shown as
unsupported and rejected on save.

Credential handling:

- Credentials are encrypted at rest and never shown back in full.
- When the card lists multiple schemes, VibeXP picks one deterministically:
  the card's declared security requirements first, then alphabetical order.
- Once credentials are stored, VibeXP also uses them to re-fetch the agent
  card, so cards behind authentication work too.

## Running tasks

Open an agent and send a message to start a task:

1. Select an active agent
2. Type your task in the chat
3. Send

Example:

```
Analyze this codebase and identify performance bottlenecks in the API layer.
```

VibeXP picks the invocation mode automatically:

- **Streaming** agents return updates live over SSE as the task progresses.
- **Synchronous** agents return a reply directly. If the task is not yet
  terminal, VibeXP polls it until it completes (up to 5 minutes).

### Task statuses

| Status | Meaning |
| --- | --- |
| `pending` / `submitted` | Task accepted, not yet running |
| `working` / `running` | The agent is executing the task |
| `input-required` | The agent is waiting for your input |
| `auth-required` | The agent is waiting for authorization |
| `completed` / `success` | Task finished successfully |
| `failed` / `error` | Task ended with an error |
| `cancelled` | Task was cancelled |

### Cancelling a task

While a task is running, a **Cancel** button appears in the chat. Cancelling
stops the local stream, asks the remote agent to cancel the task, and marks
the execution `cancelled`. A task that already reached a terminal state
cannot be cancelled.

### Timeouts

Timeouts are set by the instance operator, not per task:

- Synchronous tasks: 5 minutes by default (`a2a.default_timeout`)
- Streaming tasks: 2 hours by default (`a2a.stream_timeout`)

Streaming uses its own timeout, so long-running streams are not cut short by
the sync limit.

## Conversations

Messages to the same agent are grouped into conversations, so follow-ups keep
full context:

- Continue a conversation by opening it and sending another message.
- Click **Start new chat** to begin a fresh conversation.
- Past executions, replies, timestamps, and errors stay available in the
  conversation history.

## Agent stats

The Agents page shows per-agent and team-level stats:

- Per agent: total runs, success rate, last run
- Team: total, active, paused, and errored agents, runs today and this week,
  and recent activity

## Security

- **Encrypted credentials**: agent credentials are encrypted at rest and can
  be updated or deleted anytime.
- **Team isolation**: agents and their conversations are scoped to the team.
- **Host protection**: production deployments block internal and
  cloud-metadata addresses to prevent request forgery.
- **Activity log**: agent changes and runs are recorded in team activity.

## Troubleshooting

### Cannot add an agent

- Check the base URL: the card must exist at
  `<base URL>/.well-known/agent-card.json`.
- Confirm the card is valid A2A: name, description, version, interfaces,
  input and output modes, and skills are required.
- On a production instance, make sure the agent host is publicly reachable.
  Private and loopback addresses only work in local development.

### Task fails

- Read the error in the conversation history.
- Verify the stored credentials are still valid.
- Send a new message to retry. There is no automatic retry.

### Agent is offline

Running tasks fail with a network or timeout error. Once the agent is back,
send a new message to run the task again.

## Frequently asked questions

### What agents are compatible?

Any agent implementing the A2A protocol, v1.0 or v0.3. This includes custom
agents you build and host yourself.

### How many agents can I connect?

Agent count per team is bounded by your plan's resource limit.

### Are conversations private?

Conversations are scoped to your team and stored with the rest of your team
data. Agent credentials are encrypted.

### Can I run agents on my own infrastructure?

Yes. Build an A2A agent, serve its card at
`/.well-known/agent-card.json`, and add its base URL. On a self-hosted
instance in local development mode, `localhost` agents work too.

## Related features

- [MCP Server](/user-guide/mcp-server) - Direct tool integration
- [Artifacts](/user-guide/artifacts) - Store agent outputs
- [Memory](/user-guide/memory) - Provide context to agents
