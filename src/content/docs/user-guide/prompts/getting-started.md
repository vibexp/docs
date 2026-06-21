---
title: Getting Started
description: A step-by-step walkthrough for creating, configuring, and saving your first prompt in VibeXP.
sidebar:
  order: 2
---

This guide walks you through creating your first prompt in VibeXP.

## Accessing Prompt Management

1. Log into your VibeXP account on your deployed VibeXP app (your own VibeXP instance)
2. Click **Prompts** in the left sidebar
3. Select **My Prompts** to view your prompt library

The Prompt Management page displays:
- **Total Prompts**: Count of all your prompts
- **Published**: Number of finalized, ready-to-use prompts
- **Drafts**: Work-in-progress prompts
- **Recent Activity**: Prompts updated this week

## Creating Your First Prompt

### Step 1: Start Creation

Click the **New Prompt** button in the top right corner of the Prompt Management page.

### Step 2: Add a Title

In the title field at the top, enter a clear, descriptive name for your prompt.

**Good examples:**
- "Blog Post Outline - Tech Industry"
- "Email Template - Customer Onboarding"
- "Code Review - Security Focus"

**Avoid:**
- Generic names like "Prompt 1" or "Test"
- Vague descriptions like "Writing stuff"

### Step 3: Write Prompt Content

In the main editor, write your prompt instructions. The editor supports:

**Plain text instructions:**
```
Write a blog post about sustainable technology practices.
Include an introduction, 3 main sections, and a conclusion.
```

**Markdown formatting:**
```
Write a blog post with:

**Introduction**
- Hook the reader
- State the main topic

**Main Content**
- 3 detailed sections
- Include examples

**Conclusion**
- Summarize key points
- Call to action
```

**Pro Tip**: The editor includes a helpful reminder - "Type @ to reference other prompts (e.g., @hello-world)". We'll cover this in the [Advanced Features](/user-guide/prompts/advanced-features) guide.

### Step 4: Add a Description (Optional)

In the Settings panel on the right, you can add a brief description (max 200 characters) that explains the prompt's purpose. This helps you find prompts later when your library grows.

### Step 5: Configure Settings

**Status**
- **Draft**: Use this for work-in-progress prompts you're still refining
- **Published**: Use this when your prompt is finalized and ready to use

For your first prompt, leave it as **Draft** while you're learning.

**Labels**
Add tags to categorize your prompt. Type a label name and press Enter to add it.

Examples:
- `blog-writing`
- `customer-support`
- `marketing`

You can add up to 10 labels.

**Available in MCP**
This checkbox makes your prompt accessible through VibeXP's MCP server, allowing you to use it directly in Claude Code, Cursor, VS Code, and other MCP-compatible tools.

For your first prompt, you can leave this checked or unchecked depending on whether you plan to use it with these tools.

**Slug**
This is an auto-generated URL-friendly identifier. You typically don't need to change this unless you want a specific URL format.

### Step 6: Preview Your Prompt

1. Click the **Preview** tab to see how your prompt renders with markdown formatting
2. Review the output
3. Switch back to the **Write** tab to make any edits

### Step 7: Save Your Prompt

Click the **Save as Draft** button in the top right to save your prompt.

You'll be redirected back to the Prompt Management page where you can see your new prompt listed with a yellow "Draft" badge.

## Example: Your First Prompt

Let's create a simple email template prompt:

**Title:** Professional Email Template

**Description:** Template for writing professional business emails

**Content:**
```
Write a professional email with the following:

**To:** [Recipient name and role]
**Subject:** [Email subject line]

**Opening:**
Start with an appropriate greeting and brief context.

**Body:**
- State the purpose clearly
- Provide necessary details
- Keep it concise and actionable

**Closing:**
- Summarize any action items
- End with a professional sign-off

**Tone:** Professional and friendly
```

**Labels:** `email`, `communication`, `business`

**Status:** Draft

Save this prompt, and you've created your first template! In the next section, you'll learn how to make it more flexible using variables.

## Next Steps

Now that you've created your first prompt:

1. [Learn how to manage and organize prompts](/user-guide/prompts/managing-prompts)
2. [Explore advanced features like variables and prompt references](/user-guide/prompts/advanced-features)
3. [Discover best practices for prompt design](/user-guide/prompts/best-practices)

## Using the Prompt Gallery

Not sure where to start? Explore the **Prompt Gallery** (accessible from the Prompts sidebar menu) to find pre-built templates organized by category:

- Customer Support
- Data Analysis
- Engineering
- Marketing
- Product Management

You can use these as starting points or inspiration for your own prompts.
