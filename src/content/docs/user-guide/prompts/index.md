---
title: Prompts Overview
description: Create, organize, and reuse AI prompt templates to streamline your workflow and ensure consistent results across any AI model.
sidebar:
  order: 1
---

Create, organize, and reuse AI prompt templates to streamline your workflow and ensure consistent results across any AI model.

## What Are Prompts?

Prompts in VibeXP are reusable templates that help you structure and standardize your AI interactions. Instead of rewriting instructions from scratch, create a prompt once and use it repeatedly with dynamic content through variables.

## Why Use Prompts?

- **Eliminate Repetition**: Stop rewriting the same instructions for similar tasks
- **Maintain Consistency**: Ensure uniform quality across team projects
- **Save Time**: Transform 10-minute prompt crafting into 30-second form filling
- **Build Knowledge**: Create a searchable library of proven templates
- **Enable Reuse**: Share templates across projects and team members

## Key Features

### Prompt Library
Organize all your prompts in one centralized location. Access them from the VibeXP dashboard by clicking **Prompts** → **My Prompts** in the left sidebar.

### Prompt Gallery
Explore pre-built prompt templates organized by category:
- Customer Support
- Data Analysis
- Engineering
- Marketing
- Product Management

Use these templates as starting points or inspiration for your own prompts.

### Dynamic Variables
Create flexible prompts using placeholders that can be filled with different content each time you use them.

```
Write a {{content_type}} about {{topic}} for {{audience}}.
```

### Prompt References
Build modular, composable prompts by referencing other prompts using the `@` syntax. This enables you to create base instructions that can be reused across multiple specialized prompts.

### MCP Integration
Make your prompts accessible directly from AI tools like Claude Code, Cursor, and VS Code through the Model Context Protocol.

### API Access
Programmatically manage and execute prompts via REST API for seamless integration with your existing workflows and tools.

## Common Use Cases

**Content Creation**
Generate blog posts, social media content, and marketing copy with consistent brand voice and formatting.

**Software Development**
Create pull request descriptions, code review checklists, and technical documentation following team standards.

**Business Communication**
Draft emails, meeting summaries, and reports that maintain professional tone and structure.

**Customer Support**
Respond to customer inquiries with consistent, helpful messaging that aligns with your support guidelines.

## Quick Navigation

- [Getting Started](/user-guide/prompts/getting-started) - Create your first prompt
- [Managing Prompts](/user-guide/prompts/managing-prompts) - Organize and maintain your library
- [Advanced Features](/user-guide/prompts/advanced-features) - Variables, references, and MCP integration
- [Best Practices](/user-guide/prompts/best-practices) - Tips for effective prompt design
- [API Integration](/user-guide/prompts/api-integration) - Programmatic access
- [FAQ](/user-guide/prompts/faq) - Common questions

## Related Features

- [MCP Server Integration](/user-guide/mcp-server) - Access prompts from AI tools
- [API Keys](/user-guide/integrations/api-keys) - Set up programmatic access
- [Artifacts](/user-guide/artifacts) - Store AI-generated outputs
- [Memory](/user-guide/memory) - Build context for AI interactions
