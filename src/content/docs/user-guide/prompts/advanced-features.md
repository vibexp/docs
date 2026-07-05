---
title: Advanced Features
description: Take your prompts further with variables, prompt references, markdown formatting, and MCP integration.
sidebar:
  order: 4
---

Take your prompts to the next level with variables, prompt references, markdown formatting, and MCP integration.

## Variables

Variables make prompts flexible by creating placeholders for dynamic content that changes each time you use the prompt.

### Basic Syntax

Wrap variable names in double curly braces:

```
{{variable_name}}
```

### Variable Examples

**Content Creation**
```
Write a {{content_type}} about {{topic}} for {{audience}}.

The content should be {{tone}} and approximately {{word_count}} words long.

Key points to cover:
- {{point_1}}
- {{point_2}}
- {{point_3}}
```

**Code Review**
```
Review this {{language}} code for:
- Performance issues
- Security vulnerabilities
- Best practices
- Code style

Code:
{{code_snippet}}
```

**Email Template**
```
Write a professional {{email_type}} to {{recipient}} regarding {{subject}}.

Context: {{background_info}}
Objective: {{desired_outcome}}
Tone: {{tone}}
```

### Variable Naming Best Practices

**Use descriptive, lowercase names with underscores:**
```
✅ {{target_audience}}
✅ {{word_count}}
✅ {{email_type}}

❌ {{var1}}
❌ {{TA}}
❌ {{Type-Of-Content}}
```

**Make names self-explanatory:**
```
✅ {{customer_support_issue}}
❌ {{issue}}

✅ {{blog_post_title}}
❌ {{title}}
```

**Group related variables:**
```
{{seo_title}}
{{seo_description}}
{{seo_keywords}}
```

**Avoid special characters except underscores:**
```
✅ {{primary_cta}}
❌ {{primary-cta}}
❌ {{primary.cta}}
❌ {{primary cta}}
```

### Variable Limitations

**No nested variables**: Variables cannot contain other variables
```
❌ {{var_{{other_var}}}}
```

**No default values**: Variables don't currently support default values (feature planned)

**Document expected formats** in your prompt:
```
Write about {{topic}}.

Format: {{output_format}}
(options: blog-post, social-media, email, documentation)
```

## Prompt References

Build modular, composable prompts by referencing existing ones using the `@` syntax.

### How to Reference Prompts

1. In the prompt editor, type `@`
2. A list of available prompts appears
3. Select a prompt to insert its reference
4. The syntax is: `@prompt-slug`

### Example Use Case

**Base Instructions Prompt** (slug: `base-instructions`)
```
You are a professional technical writer.
Follow these guidelines:
- Use clear, concise language
- Structure content with headings
- Include code examples where relevant
- Write for a developer audience
```

**Blog Post Prompt** (references base instructions)
```
@base-instructions

Write a technical blog post about {{topic}}.

Target audience: {{audience}}
Length: {{word_count}} words
Include: {{key_points}}
```

When you use the Blog Post prompt, it automatically includes the content from `base-instructions`.

### Benefits of Prompt References

**DRY Principle (Don't Repeat Yourself)**
Write common instructions once and reuse everywhere. Update the base prompt and all references update automatically.

**Layered Complexity**
Combine simple prompts into sophisticated workflows:

```
@company-tone-guidelines

@blog-structure

Write about {{topic}} following the above guidelines.
```

**Team Standards**
Share base prompts to ensure everyone follows the same guidelines:

```
@coding-standards

@security-checklist

Review the code in {{file_path}}.
```

### Best Practices for References

**Create Base Prompts for Common Patterns**
- Company voice and tone
- Formatting standards
- Security guidelines
- Code style rules

**Keep Base Prompts Focused**
Each base prompt should cover one aspect. Combine multiple references rather than creating one massive base prompt.

**Document Dependencies**
In the prompt description, note which prompts it references. This helps prevent broken references.

**Test Before Deleting**
Before deleting a prompt, search your library for `@prompt-slug` to find all references.

## Markdown Formatting

The prompt editor supports markdown for rich text formatting.

### Supported Markdown Syntax

**Bold text**
```
**bold text** or __bold text__
```

**Italic text**
```
*italic text* or _italic text_
```

**Code snippets**
````
Inline `code` or blocks:

```
code block
```
````

**Headings**
```
# Heading 1
## Heading 2
### Heading 3
```

**Lists**
```
- Bullet point
- Another point

1. Numbered item
2. Another item
```

**Links**
```
[Link text](https://example.com)
```

**Blockquotes**
```
> This is a quote
```

### Formatting Best Practices

**Use structure to improve clarity:**
```
Write a product description with:

## Introduction
Brief overview highlighting the main benefit

## Key Features
- Feature 1: {{feature_1}}
- Feature 2: {{feature_2}}
- Feature 3: {{feature_3}}

## Technical Specifications
{{specs}}

## Call to Action
End with a compelling reason to {{desired_action}}
```

**Emphasize important instructions:**
```
Write a blog post about {{topic}}.

**IMPORTANT**: Use a {{tone}} tone and avoid technical jargon.

*Note*: Include at least 3 real-world examples.
```

**Create clear sections:**
```
# Task
Write a product comparison

## Requirements
- Compare {{product_1}} vs {{product_2}}
- Focus on {{comparison_criteria}}
- Length: {{word_count}} words

## Format
Use a table with these columns:
- Feature
- {{product_1}}
- {{product_2}}
- Winner
```

## MCP Integration

Make your prompts accessible directly from AI tools through the Model Context Protocol.

### What is MCP?

MCP (Model Context Protocol) is a standard that allows AI applications to access external resources. VibeXP's MCP server lets you use your prompts in:

- Claude Code CLI
- Cursor IDE
- VS Code with Claude extension
- Other MCP-compatible tools

### Enabling MCP Access

1. Edit your prompt
2. Set the prompt's status to **Published** — the toggle only appears for published prompts
3. In the Settings panel, turn on **Available in MCP**
4. Save the prompt

The **Available in MCP** toggle controls whether the prompt is exposed to connected MCP clients as a native MCP prompt. Only **published** prompts can be exposed — switching a prompt back to draft turns the toggle off automatically.

### Using MCP-Enabled Prompts

Once enabled, the prompt appears in connected clients under its slug as a native MCP prompt. Clients that support MCP prompts (such as Claude Code) list your exposed prompts, show each prompt's `{{variable}}` placeholders as named arguments, and render the prompt with your values filled in. In Claude Code, for example, exposed prompts show up as slash commands you can invoke directly.

### MCP Configuration

To connect VibeXP's MCP server to your tools, see the [MCP Server Integration](/user-guide/mcp-server) guide for complete setup instructions.

### MCP API Capabilities

Over MCP, connected AI agents can work with your prompt library in three ways:

- **Create and update prompts** — the `vibexp_io_create_prompt` and `vibexp_io_update_prompt` tools let agents write to your prompt library.
- **Find prompt content** — the generic `vibexp_io_search` tool searches your prompts (alongside artifacts, blueprints, and memories) by meaning; narrow it to prompts with the `types` filter.
- **List and render exposed prompts** — published prompts with **Available in MCP** enabled are served as native MCP prompts, with placeholder resolution handled by VibeXP.

There are no dedicated prompt read tools — reading goes through search or the native MCP prompts.

### Best Practices for MCP Prompts

**Publish prompts you want exposed**
Only published prompts can be made available in MCP — moving a prompt back to draft removes it from connected clients.

**Use clear, unique names**
Tool users will see prompt names in selection lists. Make them descriptive and distinguishable.

**Document variables in the description**
Help tool users understand what variables the prompt expects.

**Test in your target tools**
Verify the prompt works as expected in the applications where it will be used.

## Combining Features

The most powerful prompts combine multiple features:

```
@company-voice

@content-structure

Write a {{content_type}} about {{topic}}.

**Target Audience:** {{audience}}
**Word Count:** {{word_count}}
**Tone:** {{tone}}

## Required Sections
- Introduction
- {{section_1}}
- {{section_2}}
- {{section_3}}
- Conclusion

*Include real-world examples for each section.*
```

This prompt:
- References two base prompts for consistency
- Uses variables for flexibility
- Applies markdown for structure
- Can be MCP-enabled for tool integration

## Next Steps

- [Learn best practices](/user-guide/prompts/best-practices) for designing effective prompts
- [Explore API integration](/user-guide/prompts/api-integration) for programmatic access
- [Review FAQs](/user-guide/prompts/faq) for common questions
