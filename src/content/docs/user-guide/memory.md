---
title: Memory
description: Your personal AI knowledge vault that remembers project details, preferences, and workflows so you never explain the same thing twice.
sidebar:
  order: 5
---

Your personal AI knowledge vault that remembers everything important about your projects, preferences, and workflows. Never explain the same thing twice.

## Overview

Memory Management is an intelligent context persistence system that stores, organizes, and retrieves important information across all your AI interactions. Think of it as your AI's long-term memory.

### Key Benefits

- **Never Repeat Yourself**: Store context once, use everywhere
- **Instant Recall**: Find any memory in milliseconds
- **Auto-Context**: AI automatically references relevant memories
- **Rich Metadata**: Tags, categories, and custom fields
- **Cross-Platform**: Web, API, and MCP access

## What Are Memories?

Memories are text-based information snippets that provide context to AI conversations:

- Project specifications
- Coding standards and conventions
- Personal preferences and style guides
- Workflow procedures
- Important facts and decisions
- Team guidelines
- Technical constraints

## Creating Memories

### Manual Creation

1. Navigate to **Memory** in the sidebar
2. Click **Create New Memory**
3. Enter memory details:
   - **Text**: The memory content
   - **Project**: Organization grouping (optional)
   - **Metadata**: Tags, category, priority, custom fields
4. Click **Save**

### Example Memory

```
Project: vibexp-backend
Category: coding-standards
Priority: high

TypeScript Style Guide:
- Use functional components with hooks
- Prefer const over let
- Use async/await over promises
- Follow Airbnb ESLint rules
- Document complex functions with JSDoc
```

### Automatic Creation via MCP

Connected AI tools can create memories during conversations:

```typescript
vibexp_io_create_memory({
  text: "User prefers React with TypeScript and Tailwind CSS",
  project_name: "user/preferences",
  metadata: {
    category: "coding_preferences",
    priority: "medium"
  }
})
```

## Organizing Memories

### Project Grouping

Organize memories by project:

```
user/preferences
company/main-app
personal/workflows
client/project-x
```

### Metadata Organization

#### Categories

Organize by category:
- `coding_standards`
- `project_specs`
- `workflow_procedures`
- `personal_preferences`
- `team_guidelines`

#### Priorities

Set importance levels:
- `high`: Critical context always referenced
- `medium`: Important but context-dependent
- `low`: Nice-to-have background information

#### Custom Tags

Add searchable tags:
- Technology: `typescript`, `react`, `nodejs`
- Domain: `frontend`, `backend`, `devops`
- Purpose: `style-guide`, `architecture`, `deployment`

## Searching and Filtering

### Full-Text Search

Search across all memory content:

```
Search: "React hooks best practices"
```

Finds all memories mentioning React hooks and best practices.

### Advanced Filters

Filter memories by:
- **Project**: Specific project memories
- **Category**: Group by type
- **Priority**: Importance level
- **Tags**: Custom tag filtering
- **Creation Date**: Time-based filtering

### Quick Access

- **Recent**: Last accessed memories
- **Favorites**: Star important memories
- **Project View**: All memories for a project

## Auto-Context Injection

### How It Works

When using AI tools connected via MCP:

1. You start a conversation
2. AI analyzes the context and topic
3. Relevant memories are automatically searched
4. Matching memories are injected as context
5. AI uses this context in responses

### Relevance Matching

Memories are matched based on:
- **Keywords**: Content similarity
- **Project**: Current project context
- **Priority**: High-priority memories preferred
- **Recency**: Recently accessed memories weighted higher

### Manual Reference

You can also manually reference memories:

```
"Using the coding standards from memory..."
"Apply the deployment procedure we discussed..."
```

Connected AI tools can search and retrieve specific memories on demand.

## Updating Memories

### Edit Existing

1. Find the memory
2. Click **Edit**
3. Update text or metadata
4. Save changes

### Version Notes

Add a note when making significant changes:

```
Updated: 2024-01-15
Changes: Added new TypeScript conventions
Previous: Used any types, now strict typing
```

## Bulk Operations

### Batch Update

1. Select multiple memories
2. Click **Bulk Actions** → **Update Metadata**
3. Add/remove tags, change category, or update priority

### Batch Delete

1. Select memories to remove
2. Click **Bulk Actions** → **Delete**
3. Confirm deletion

## MCP Integration

### Creating Memories

```javascript
// AI tools create memories during conversations
vibexp_io_create_memory({
  text: "User's testing framework preference: Jest with React Testing Library",
  project_name: "user/preferences",
  metadata: {
    category: "testing",
    priority: "medium",
    tags: ["jest", "react", "testing"]
  }
})
```

### Searching Memories

```javascript
// AI tools search memories for context
vibexp_io_search_memories({
  project_name: "user/backend-project",
  search: "database",
  limit: 5
})
```

### Retrieving Specific Memory

```javascript
// Get memory by ID
vibexp_io_get_memory({
  memory_id: "mem_abc123xyz"
})
```

### Updating Memories

```javascript
// Update memory content or metadata
vibexp_io_update_memory({
  memory_id: "mem_abc123xyz",
  text: "Updated content...",
  metadata: {
    priority: "high"
  }
})
```

## Common Use Cases

### Coding Preferences

```
Category: coding_preferences
Priority: high

TypeScript Preferences:
- Strict mode enabled
- Functional components only
- Use Zod for validation
- Prefer composition over inheritance
```

### Project Context

```
Project: client/ecommerce-app
Category: project_specs

Architecture:
- Next.js 14 with App Router
- PostgreSQL database
- Prisma ORM
- Tailwind CSS for styling
- Deployed on Vercel
```

### Workflow Procedures

```
Category: workflows
Priority: medium

Git Workflow:
1. Create feature branch from main
2. Make changes with conventional commits
3. Run tests locally
4. Push and create PR
5. Wait for CI and review
6. Squash merge to main
```

### Team Guidelines

```
Project: company/main-app
Category: team_guidelines
Priority: high

Code Review Guidelines:
- All PRs require 2 approvals
- Must pass all CI checks
- Update documentation for new features
- Add tests for bug fixes
```

## Tips and Best Practices

### Memory Content

- Be specific and concise
- Include relevant context
- Use clear, searchable language
- Update regularly as preferences change

### Metadata Strategy

- Use consistent categories across memories
- Assign appropriate priorities
- Add multiple relevant tags
- Include project context when applicable

### Organization

- Group related memories by project
- Use hierarchical projects for large organizations
- Regular cleanup of outdated memories
- Archive old memories instead of deleting

### Search Optimization

- Include keywords in memory text
- Use tags for common search terms
- Add context in metadata
- Keep memory text focused

## API Access

### REST API Endpoints

```bash
# List memories
GET /api/v1/memories?project_name=user/project

# Get specific memory
GET /api/v1/memories/{memory_id}

# Create memory
POST /api/v1/memories

# Update memory
PUT /api/v1/memories/{memory_id}

# Delete memory
DELETE /api/v1/memories/{memory_id}
```

See [API Keys](/user-guide/integrations/api-keys) for authentication.

## Frequently Asked Questions

### How many memories can I store?

Unlimited. Create as many memories as needed for your context library.

### How does auto-context work?

When AI tools are connected via MCP, they automatically search your memories for relevant context based on conversation topics and keywords.

### Can I control which memories are used?

Yes. Use priority levels and project grouping to control which memories are most likely to be referenced.

### Are memories shared between projects?

Memories can be project-specific or global. Project-specific memories are only referenced in that project context.

### Can I export memories?

Yes. Export memories individually or in bulk as JSON or Markdown files.

### How secure are my memories?

All memories are encrypted at rest and in transit. Access is controlled via API keys with user-specific isolation.

## Related Features

- [MCP Server Integration](/user-guide/mcp-server) - Auto-inject memories in AI conversations
- [Artifacts](/user-guide/artifacts) - Store larger content pieces
- [Prompts](/user-guide/prompts) - Reusable AI templates
