---
title: Managing Prompts
description: Learn how to view, search, filter, edit, delete, and organize the prompts in your VibeXP library.
sidebar:
  order: 3
---

Learn how to view, search, filter, edit, and delete prompts in your library.

## Viewing Your Prompts

Navigate to **Prompts** → **My Prompts** from the left sidebar to see your prompt library.

The prompts list displays:
- **Name**: Prompt title with icons indicating special features (MCP-enabled, references, etc.)
- **Description**: Brief summary of the prompt's purpose
- **Status**: Draft (yellow badge) or Published (green badge)
- **Updated**: Last modification date
- **Actions**: View, Edit, and Delete buttons

## Searching Prompts

Use the search bar at the top of the Prompt Management page to find prompts quickly.

**Search by:**
- Prompt name
- Description text

Search does **not** look inside the prompt body, so a phrase you only wrote in the prompt text will not match. Type your search term and the list updates to show matching prompts.

**Example searches:**
- "blog" - finds all blog-related prompts
- "customer" - finds customer support and customer-facing prompts
- "email" - finds all email template prompts

## Filtering Prompts

The filter bar sits above the list: a search box and three dropdowns.

| Filter | Options | What it does |
| --- | --- | --- |
| **Status** | All statuses, Published, Draft | Focus on work in progress, or only production-ready templates |
| **Sharing** | All, Shared, Not shared | Find prompts with an active share link |
| **Freshness** | All freshness, Stale only | Show only prompts nobody has used lately |

The filters combine, so **Published** plus **Stale only** answers "which of our finished prompts has gone quiet".

### Filter by Freshness

**Stale only** lists the prompts your team's freshness rules currently flag. Flagged prompts also carry a quiet **Stale** badge in the list, which you can hover to see when the prompt was last used. If your team has no freshness rules, nothing is ever flagged. See [Resource Freshness](/user-guide/resource-freshness/).

### Filtering by label

There is no label dropdown on the list page. Filter by label through the API's `labels` parameter instead, described in [API Integration](/user-guide/prompts/api-integration/).

## Sorting Prompts

Click any column header to sort the prompt list:

- **Name**: Alphabetical order (A-Z or Z-A)
- **Status**: Group by Draft or Published
- **Updated**: Most recent or oldest first

The API also sorts by **Created** (`sort_by=created_at`).

The currently sorted column displays an arrow indicator showing the sort direction.

## Editing Prompts

To modify an existing prompt:

1. Locate the prompt in your list (use search/filter if needed)
2. Click the **Edit** button (pencil icon) in the Actions column
3. Make changes to:
   - Title
   - Content
   - Description
   - Labels
   - Status
   - MCP availability
   - Slug
4. Click **Save as Draft** or change status to **Published** and save

The prompt editor is identical to the creation interface, so all the same features are available.

## Deleting Prompts

To permanently remove a prompt:

1. Locate the prompt in your list
2. Click the **Delete** button (trash icon) in the Actions column
3. Confirm deletion in the dialog that appears

**Warning:** Deleted prompts cannot be recovered. If other prompts reference the deleted prompt using the `@` syntax, those references will fail to resolve.

### Before Deleting

Check if the prompt is:
- Referenced by other prompts (use search to find references like `@prompt-slug`)
- Being used in active workflows
- Enabled for MCP access by external tools

Consider changing the status to Draft instead of deleting if you might need the prompt later.

## Viewing Prompt Details

To view a prompt without editing:

1. Click the **View** button (eye icon) in the Actions column
2. Review the prompt content and settings in read-only mode
3. Click **Back to Prompts** or use your browser's back button to return to the list

This is useful for:
- Quickly checking prompt content
- Copying prompt text to use elsewhere
- Verifying settings without risk of accidental changes

## Bulk Operations

While individual prompt management is straightforward, you can work more efficiently with multiple prompts:

**Checkbox Selection**
Click the checkbox at the start of each row to select multiple prompts. This prepares prompts for bulk operations (feature availability may vary).

## Organizing Your Library

### Using Labels Effectively

Create a labeling system that matches your workflow:

**By Domain**
- `marketing`, `engineering`, `support`, `sales`

**By Format**
- `email`, `blog`, `social-media`, `documentation`

**By Complexity**
- `beginner`, `advanced`, `template`

**By Project**
- `project-alpha`, `client-xyz`, `internal`

**Example organization:**
A blog writing prompt might have labels: `marketing`, `blog`, `template`

### Naming Conventions

Use clear, descriptive titles that indicate:
- **Purpose**: What the prompt does
- **Domain**: What area it applies to
- **Format**: What type of output it generates

**Good Examples:**
- "Blog Post Outline - Tech Industry"
- "Code Review - Security Focus"
- "Email Template - Customer Onboarding"

**Poor Examples:**
- "Prompt 1"
- "Test"
- "asdfasdf"

### Draft vs Published Workflow

**Use Drafts For:**
- Experimenting with new prompt ideas
- Testing different phrasings
- Collecting work-in-progress templates
- Collaborating on prompt development

**Use Published For:**
- Production-ready templates
- Shared team resources
- MCP-accessible prompts
- Client-facing templates

**Best Practice:** Create new versions as drafts while keeping the published version stable. Test thoroughly before promoting drafts to published.

## Maintaining Your Library

Regular maintenance keeps your prompt library useful and organized:

**Regular Cleanup** (monthly or quarterly)
- Archive or delete unused prompts
- Update outdated instructions
- Consolidate similar prompts
- Remove test prompts

**Version Documentation**
- Update descriptions when making significant changes
- Note breaking changes in the prompt content itself
- Consider creating a new prompt for major revisions rather than editing the original

**Quality Checks**
- Test prompts periodically to ensure they still produce desired results
- Update prompts as AI models evolve
- Refine variable names and instructions based on usage experience

## Load Template Feature

When creating or editing a prompt, use the **Load Template** button to:
- Import content from an existing prompt
- Start with a pre-built template structure
- Quickly duplicate and modify existing prompts

This speeds up prompt creation by building on proven templates.

## Next Steps

- [Learn about advanced features](/user-guide/prompts/advanced-features) like variables and prompt references
- [Explore best practices](/user-guide/prompts/best-practices) for effective prompt design
- [Set up API integration](/user-guide/prompts/api-integration) for programmatic access
