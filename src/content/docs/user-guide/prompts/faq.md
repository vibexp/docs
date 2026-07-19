---
title: FAQ
description: Common questions and answers about creating, managing, and integrating VibeXP prompts.
sidebar:
  order: 7
---

Common questions and answers about VibeXP prompts.

## General Questions

### Can I use prompts with any AI tool?

Yes. You can copy prompts and use them with any AI tool including ChatGPT, Claude, Gemini, and others. For direct integration without copy-pasting, enable MCP access to use prompts in Claude Code, Cursor, and VS Code.

### How many prompts can I create?

There's no limit on the number of prompts you can create. Build your library as large as needed to support your workflows.

### Are prompts private?

Prompts belong to a **team**. Everyone in the team can see and use the team's prompts. They are not visible outside the team unless explicitly shared.

### Can I share prompts with my team?

Yes, automatically: prompts are team-scoped, so all team members can view and use them. Prompts can also be shared explicitly via a share link for access outside the team.

### Is there a mobile app?

VibeXP is accessible via web browser on your deployed VibeXP app (your own VibeXP instance). While there's no dedicated mobile app yet, the web interface is mobile-responsive. A native mobile app is on the roadmap.

## Creating and Editing Prompts

### What is the difference between Draft and Published status?

**Draft**: Work-in-progress prompts that you're still refining. Use drafts for testing and experimentation.

**Published**: Finalized prompts that are ready for use. Published prompts are more stable for MCP integration and team sharing.

You can change status at any time. The choice helps you organize your library and distinguish between stable templates and experiments.

### Can I use HTML in prompts?

No. The prompt editor supports Markdown formatting, not HTML. Markdown provides structure (headings, lists, bold, italic) while keeping prompts readable and portable across AI tools.

### How do I add line breaks in prompts?

Press Enter/Return to add line breaks. The editor preserves your formatting, including blank lines between sections.

### Can I upload prompts from a file?

Not directly through the UI, but you can:
1. Copy content from any file and paste into the prompt editor
2. Use the **Load Template** button to import from existing prompts
3. Use the [API](/user-guide/prompts/api-integration) to programmatically create prompts from files

### What happens if I delete a prompt by accident?

Deleted prompts cannot be recovered. There's no "trash" or recycle bin. Before deleting important prompts, consider:
- Changing status to Draft instead of deleting
- Exporting the prompt for backup
- Creating a "deprecated" label for prompts you no longer use

## Variables and References

### Do variables support default values?

Not currently. Default values for variables are on the roadmap. For now, document recommended default values in the prompt description or include them as comments in the prompt content.

### Can I nest variables?

No. Variables cannot contain other variables. This syntax is not supported:
```
{{var_{{other_var}}}}
```

Each variable must be a standalone placeholder.

### What happens if I reference a deleted prompt?

If you delete a prompt that's referenced by others using the `@` syntax, those references will fail to resolve. Before deleting a prompt:
1. Search your library for `@prompt-slug` to find all references
2. Update or remove those references
3. Or keep the prompt as a Draft instead of deleting

### Can I reference prompts from other users?

Prompt references work with any prompt in your team's library, including prompts created by your teammates.

### How many prompts can I reference in a single prompt?

There's no hard limit, but best practice is to keep references focused. Referencing more than 3-4 prompts may make your prompt complex and hard to maintain.

## MCP Integration

### What is MCP?

MCP (Model Context Protocol) is an open standard that allows AI applications to access external resources. VibeXP's MCP server lets you use your prompts directly in Claude Code, Cursor, VS Code, and other compatible tools without copy-pasting.

### How do I enable MCP for my prompts?

1. Edit your prompt
2. Check the **Available in MCP** checkbox in the Settings panel
3. Save the prompt

See the [MCP Server Integration guide](/user-guide/mcp-server) for tool setup instructions.

### Do I need MCP to use prompts?

No. MCP is optional. You can use prompts by copying them to any AI tool. MCP just provides a more seamless integration for supported tools.

### Why aren't my MCP-enabled prompts showing up in my tool?

Check that:
1. The prompt status is Published (recommended for stability)
2. Your MCP server is configured correctly in the tool
3. Your API key has the necessary permissions
4. The tool's MCP client is connected to VibeXP

See the [MCP Server guide](/user-guide/mcp-server) for troubleshooting.

### Can I use MCP with ChatGPT?

No. MCP is currently supported by Claude Code, Cursor, VS Code, and other tools that implement the MCP standard. ChatGPT does not support MCP. You'll need to copy prompts manually to use them in ChatGPT.

## API and Integrations

### How do I get an API key?

1. Log into your VibeXP instance (your deployed VibeXP app)
2. Go to **Settings** → **Integration** → **API Keys**
3. Click **Generate API Key**

See the [API Keys guide](/user-guide/integrations/api-keys) for detailed instructions.

### What can I do with the API?

The API allows you to:
- List all prompts
- Get prompt details
- Create new prompts
- Update existing prompts
- Delete prompts
- Filter and search prompts

See the [API Integration guide](/user-guide/prompts/api-integration) for examples and endpoints.

### Are there API rate limits?

If your VibeXP instance is configured with rate limiting, limits are returned in API response headers (`X-RateLimit-*`). The exact limits are defined by whoever operates the instance — VibeXP is open source and has no built-in paid tiers. On a self-hosted deployment, you control the limits (or disable them entirely). See [Self-Hosting](/user-guide/self-hosting/).

### Can I export my entire prompt library?

Yes. Use the API to fetch all prompts and save them to a file. See the [API Integration guide](/user-guide/prompts/api-integration) for export examples.

Bulk export via the UI is on the roadmap.

## Organization and Management

### How do I organize a large prompt library?

Use a combination of:
- **Descriptive titles**: Make prompts easy to find by name
- **Labels**: Tag prompts by function, department, or output type
- **Status**: Use Draft/Published to separate stable from experimental
- **Search**: Use the search bar to find prompts by keyword
- **Base prompts**: Extract common patterns into reusable base prompts

See the [Best Practices guide](/user-guide/prompts/best-practices) for detailed strategies.

### Can I change a prompt's slug?

Yes. Edit the prompt and modify the Slug field in the Settings panel. However, changing a slug will break:
- Existing references (`@old-slug` will fail)
- External links to the prompt
- MCP integrations using the old slug

Only change slugs when necessary, and update all references.

### How do I find unused prompts?

Use [Resource Access Analytics](/user-guide/resource-access-analytics): each prompt has an Access activity view showing when and from where (web, MCP, API, CLI) it was last accessed. You can also:
- Sort by "Updated" date to find old prompts
- Use labels like `deprecated` to mark prompts you no longer use

### Can I duplicate a prompt?

Not directly, but you can:
1. Edit the existing prompt
2. Copy all content
3. Create a new prompt
4. Paste the content
5. Modify the title and slug

Or use the **Load Template** button when creating a new prompt to import from an existing one.

## Troubleshooting

### My prompt produces inconsistent results. What should I do?

Try these improvements:
1. **Add more specificity**: Vague instructions lead to varied outputs
2. **Include examples**: Show the AI what you want
3. **Add constraints**: Define length, format, tone, and structure
4. **Test with different inputs**: Verify the prompt handles various scenarios
5. **Break complex instructions into steps**: Make the workflow clearer

See the [Best Practices guide](/user-guide/prompts/best-practices) for detailed tips.

### The preview doesn't match what I see in my AI tool. Why?

The preview shows how Markdown renders. Different AI tools may:
- Interpret markdown differently
- Add their own formatting
- Apply model-specific behaviors

The preview is a guide, not an exact replica of AI tool output.

### I can't find a prompt I created. Where is it?

Check:
1. **Status filter**: It might be filtered out (switch to "All Status")
2. **Label filter**: Reset filters to show all prompts
3. **Search**: Try searching for keywords from the prompt
4. **Deleted**: If deleted, prompts cannot be recovered

### Variables aren't being replaced. What's wrong?

Ensure you're using the correct syntax:
- **Correct**: `{{variable_name}}`
- **Incorrect**: `{variable_name}`, `[[variable_name]]`, `$variable_name`

Variables are replaced when you execute the prompt through MCP or API, not when viewing in the VibeXP UI.

## Features and Roadmap

### Are prompts versioned?

Yes. Prompts keep a numbered content-version history, like artifacts and blueprints: each save snapshots the previous content, and you can view past versions and restore any of them. Retention is operator-configurable (20 versions by default).

### Can I schedule prompts to run automatically?

Not yet. Automated prompt execution based on triggers or schedules is planned for a future release.

### Will there be prompt templates or marketplace?

The Prompt Gallery provides pre-built templates organized by category. A community marketplace where users can share and discover prompts is on the roadmap.

### Can I collaborate with others on prompt development?

Yes. Prompts are team-scoped, so teammates can view and edit them. You can also leave [comments](/user-guide/comments) on a prompt to discuss changes. Suggestions and real-time co-editing remain on the roadmap.

### Is there an AI assistant to help write prompts?

Not currently, but AI-assisted prompt writing is on the roadmap. This will help you craft better prompts with suggestions and optimizations.

## Limits

### Is there a limit on prompt length?

While there's no strict character limit, extremely long prompts (50,000+ characters) may impact performance. Best practice is to keep prompts focused and use references to combine multiple shorter prompts.

### Do I need a paid account to use prompts?

No. VibeXP is open source and has **no paid tiers** — every feature is available to every account. If you run your own instance, the only limits are the ones you choose to configure. See [Self-Hosting](/user-guide/self-hosting/).

## Still Have Questions?

- Check the [Getting Started guide](/user-guide/prompts/getting-started)
- Review [Best Practices](/user-guide/prompts/best-practices)
- Visit the [VibeXP website](https://vibexp.io)
- Contact support through the application
