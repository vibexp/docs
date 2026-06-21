---
title: Artifacts
description: Transform your AI conversations into a searchable knowledge base by capturing, organizing, and retrieving code, documentation, and reports.
sidebar:
  order: 4
---

Transform your AI conversations into a searchable knowledge base. Capture, organize, and retrieve code snippets, documentation, and reports with powerful search and categorization.

## Overview

Artifacts Management automatically preserves substantial AI-generated content from your conversations, turning scattered outputs into an organized, searchable library. Never lose valuable code snippets or documentation again.

### Key Benefits

- **Never Lose Content**: Auto-capture AI outputs forever
- **Instant Search**: Full-text search across all artifacts
- **Smart Organization**: Categorize by project, type, and status
- **MCP Integration**: AI tools create and access artifacts automatically
- **Beautiful Previews**: Markdown rendering with syntax highlighting

## What Are Artifacts?

Artifacts are substantial pieces of AI-generated content:

- Code snippets and functions
- Documentation and guides
- Data structures and schemas
- Meeting summaries
- Analysis reports
- Technical specifications

## Creating Artifacts

### Manual Creation

1. Navigate to **Artifacts** in the sidebar
2. Click **Create New Artifact**
3. Fill in the details:
   - **Project**: Organizational grouping (e.g., "my-app/backend")
   - **Slug**: Unique identifier (auto-generated from title)
   - **Title**: Descriptive name
   - **Description**: Brief summary (optional)
   - **Type**: work_reports, static_contexts, or general
   - **Content**: Your artifact content (supports Markdown)
   - **Status**: active or expired
4. Click **Save**

### Automatic Creation via MCP

When AI tools are connected via MCP, they can automatically create artifacts during conversations:

```typescript
// AI tools can create artifacts automatically
const artifact = {
  project_name: "user/project",
  slug: "api-documentation-v1",
  title: "REST API Documentation",
  content: "# API Endpoints\n\n## Users\n...",
  type: "static_contexts",
  status: "active"
}
```

## Organizing Artifacts

### Project Structure

Organize artifacts using project naming:

```
user/project-name
organization/repository
category/subcategory
```

Examples:
- `shaharia/vibexp-backend`
- `personal/code-snippets`
- `work/documentation`

### Artifact Types

**work_reports**
- Completed analyses
- Status reports
- Summary documents

**static_contexts**
- Documentation
- Code snippets
- Technical specifications
- Reference materials

**general**
- Meeting notes
- Brainstorming sessions
- Miscellaneous content

### Status Management

- **active**: Currently relevant artifacts
- **expired**: Archived or outdated content

Change status anytime without deleting artifacts.

## Searching and Filtering

### Full-Text Search

Search across titles, descriptions, and content:

```
Search: "authentication implementation"
```

Finds all artifacts mentioning authentication and implementation.

### Advanced Filters

Filter by:
- **Project**: Show artifacts from specific projects
- **Type**: work_reports, static_contexts, or general
- **Status**: active or expired
- **Creation Date**: Date range filtering
- **Metadata**: Custom metadata fields

### Sort Options

- **Newest First**: Recently created artifacts
- **Oldest First**: Historical artifacts
- **Alphabetical**: By title or slug
- **Most Relevant**: Based on search query

## Working with Artifacts

### Preview and View

- **List View**: Quick overview with metadata
- **Detail View**: Full content with formatting
- **Markdown Rendering**: Beautiful syntax highlighting
- **Code Blocks**: Language-specific formatting

### Update and Version

1. Open an artifact
2. Click **Edit**
3. Make your changes
4. Save to update

:::note
Currently, artifacts don't maintain version history. Consider creating new artifacts with version suffixes (e.g., "api-docs-v2") for major changes.
:::

### Metadata

Add custom metadata for enhanced organization:

```json
{
  "version": "1.0",
  "language": "typescript",
  "framework": "react",
  "author": "team-frontend"
}
```

Access metadata in search and filtering.

## Bulk Operations

### Batch Delete

1. Select multiple artifacts
2. Click **Bulk Actions** → **Delete**
3. Confirm deletion

### Batch Status Update

1. Select artifacts
2. Click **Bulk Actions** → **Update Status**
3. Choose new status (active/expired)

## MCP Integration

### Creating Artifacts

Connected AI tools can create artifacts:

```javascript
// Example: AI creates artifact during conversation
vibexp_io_create_artifact({
  project_name: "user/backend-api",
  slug: "error-handler",
  title: "Error Handler Implementation",
  content: "```typescript\n...\n```",
  type: "static_contexts"
})
```

### Searching Artifacts

AI tools can search your artifacts:

```javascript
// Search for specific content
vibexp_io_search_artifacts({
  project_name: "user/backend-api",
  search: "authentication",
  limit: 10
})
```

### Retrieving Artifacts

Get specific artifacts by slug:

```javascript
// Retrieve by project and slug
vibexp_io_get_artifact({
  project_name: "user/backend-api",
  slug: "error-handler"
})
```

## Common Use Cases

### Code Snippet Library

Store reusable code snippets:

```
Project: personal/code-snippets
Type: static_contexts
Examples:
- "react-custom-hook-example"
- "api-error-handler"
- "database-connection-pool"
```

### Project Documentation

Maintain living documentation:

```
Project: company/main-app
Type: static_contexts
Examples:
- "architecture-overview"
- "deployment-guide"
- "api-reference"
```

### Work Reports

Track completed work:

```
Project: client/project-x
Type: work_reports
Examples:
- "sprint-15-summary"
- "performance-analysis"
- "security-audit-report"
```

## Tips and Best Practices

### Naming Conventions

- Use consistent slug patterns
- Include version numbers for evolving content
- Use descriptive, searchable titles

### Project Organization

- Group related artifacts by project
- Use hierarchical project names
- Keep project names short but clear

### Content Guidelines

- Use Markdown for formatting
- Include context in descriptions
- Tag with relevant metadata
- Regular cleanup of expired artifacts

### Search Optimization

- Use descriptive titles and descriptions
- Include keywords in content
- Add searchable metadata tags
- Keep content focused and specific

## API Access

### REST API Endpoints

```bash
# List artifacts
GET /api/v1/artifacts?project_name=user/project

# Get specific artifact
GET /api/v1/artifacts/{project_name}/{slug}

# Create artifact
POST /api/v1/artifacts

# Update artifact
PUT /api/v1/artifacts/{project_name}/{slug}

# Delete artifact
DELETE /api/v1/artifacts/{project_name}/{slug}
```

See [API Keys](/user-guide/integrations/api-keys) for authentication.

## Frequently Asked Questions

### How many artifacts can I store?

Unlimited. Store as many artifacts as needed to build your knowledge base.

### Can I export artifacts?

Yes. Export individual artifacts or entire projects in JSON or Markdown format.

### Do artifacts have size limits?

Individual artifacts should be under 1MB. For larger content, consider splitting into multiple artifacts.

### Can I share artifacts?

Not currently, but this feature is planned. For now, artifacts are private to your account.

### How long are artifacts stored?

Artifacts are stored indefinitely until you delete them. Use status "expired" to archive without deleting.

## Related Features

- [MCP Server Integration](/user-guide/mcp-server) - Auto-create artifacts from AI tools
- [Memory](/user-guide/memory) - Store context snippets
- [Prompts](/user-guide/prompts) - Reusable AI templates
