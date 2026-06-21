---
title: Best Practices
description: Learn how to design, organize, and maintain effective prompts that deliver consistent results.
sidebar:
  order: 5
---

Learn how to design, organize, and maintain effective prompts that deliver consistent results.

## Crafting Effective Prompts

### Be Specific

Vague instructions produce inconsistent results. Provide clear, detailed guidance.

**Avoid:**
```
Write an article.
```

**Better:**
```
Write a 1000-word technical article about {{topic}} for {{audience}}.
```

### Use Structure

Organize instructions into clear sections that guide the AI step-by-step.

**Avoid:**
```
Write a product description highlighting the benefits and features with a call to action.
```

**Better:**
```
Write a product description:

## Key Benefit
Start with the primary value proposition: {{main_benefit}}

## Features
List 3-5 features:
- {{feature_1}}
- {{feature_2}}
- {{feature_3}}

## Technical Specs
{{specifications}}

## Call to Action
End with: {{cta_text}}
```

### Include Examples

Show the AI what you want by providing examples within your prompt.

```
Write a social media post about {{topic}}.

**Format:**
Hook: [attention-grabbing opening]
Body: [key message in 1-2 sentences]
CTA: [clear action to take]
Hashtags: [3-5 relevant tags]

**Example:**
Hook: "Did you know 80% of teams waste time on repetitive tasks?"
Body: "Our automation tool saves 10 hours per week by streamlining your workflow."
CTA: "Try it free for 14 days!"
Hashtags: #productivity #automation #workflow #saas #efficiency
```

### Define Tone and Style

Specify the voice and style to ensure output matches your brand.

```
Write a {{content_type}} about {{topic}}.

**Tone:** {{tone}}
(Options: professional, casual, friendly, authoritative, conversational)

**Style Guidelines:**
- Use active voice
- Keep sentences under 20 words
- Write for {{reading_level}} reading level
- Avoid jargon unless explaining technical concepts
```

### Set Constraints

Define boundaries for length, format, and content.

```
Create a project summary:

**Length:** 300-500 words
**Format:** Plain text, no markdown
**Required sections:** Overview, Goals, Timeline, Budget
**Exclude:** Team member names, internal codes
```

## Variable Strategy

### Provide Context in Names

Variable names should be self-documenting.

**Avoid:**
```
{{var1}}, {{var2}}, {{var3}}
{{x}}, {{y}}, {{z}}
```

**Better:**
```
{{target_audience}}, {{content_tone}}, {{word_count}}
{{product_name}}, {{key_benefit}}, {{price_point}}
```

### Group Related Variables

Organize variables by theme or function.

```
Write a blog post about {{topic}}.

## SEO Settings
- Title: {{seo_title}}
- Description: {{seo_description}}
- Keywords: {{seo_keywords}}

## Content Settings
- Word count: {{word_count}}
- Tone: {{tone}}
- Audience: {{target_audience}}

## Structure
- Sections: {{section_count}}
- Include examples: {{include_examples}} (yes/no)
```

### Document Expected Input

Help users understand what values variables expect.

```
Create a support response:

Issue type: {{issue_type}}
(Options: technical, billing, feature-request, general)

Priority: {{priority}}
(Options: low, medium, high, urgent)

Customer segment: {{customer_segment}}
(Options: free-tier, pro, enterprise)
```

## Prompt Organization

### Use Descriptive Titles

Titles should clearly indicate what the prompt does.

**Good titles:**
- "Blog Post Outline - SaaS Product Marketing"
- "Code Review Checklist - Security Focus"
- "Customer Support Response - Technical Issues"

**Poor titles:**
- "Writing Prompt"
- "Template 1"
- "New Prompt"

### Leverage Labels Strategically

Create a consistent labeling taxonomy across your library.

**By function:**
- `content-creation`, `code-review`, `data-analysis`, `communication`

**By department:**
- `marketing`, `engineering`, `support`, `sales`, `product`

**By output type:**
- `email`, `blog`, `report`, `documentation`, `social-media`

**By audience:**
- `external`, `internal`, `customer-facing`, `team-only`

**Example:** A customer onboarding email template might have:
- `email`
- `customer-facing`
- `onboarding`
- `support`

### Create Base Prompts for Common Patterns

Identify instructions you repeat across prompts and extract them into reusable base prompts.

**Company Voice Base Prompt** (slug: `company-voice`)
```
Write in [Company Name]'s voice:
- Friendly but professional
- Use "we" when referring to the company
- Use "you" when addressing readers
- Keep sentences concise
- Avoid corporate jargon
```

**Technical Writing Base Prompt** (slug: `tech-writing-standards`)
```
Follow these technical writing standards:
- Define acronyms on first use
- Use code blocks for commands and code
- Include examples for complex concepts
- Structure with clear headings
- Write for developers with 2-5 years experience
```

Now reference these in specific prompts:
```
@company-voice
@tech-writing-standards

Write a tutorial about {{topic}}.
```

## Testing and Iteration

### Test with Diverse Inputs

Before publishing, test your prompt with various variable values to ensure it handles different scenarios.

**Test cases for a blog post prompt:**
- Short topics (3-4 words) and long topics (10+ words)
- Technical and non-technical audiences
- Different word counts (500, 1000, 2000 words)
- Various tones (formal, casual, authoritative)

### Verify Formatting

Use the Preview tab to check that markdown renders correctly and the structure is clear.

### Refine Based on Output

If results are inconsistent:
- Add more specific constraints
- Include examples
- Break complex instructions into steps
- Clarify ambiguous terms

### Get Feedback

Share prompts with colleagues and ask:
- Is the purpose clear?
- Are variables self-explanatory?
- Does it produce expected results?
- What edge cases might break it?

## Draft vs Published Workflow

### Use Drafts for Development

Keep prompts as drafts while:
- Testing different phrasings
- Gathering feedback
- Experimenting with structure
- Verifying output quality

### Publish When Stable

Promote to published when:
- Testing shows consistent results
- Documentation is complete
- Variables are clearly named
- All referenced prompts exist and are stable
- Team members have reviewed (if applicable)

### Version Control Strategy

When updating published prompts:

**For minor edits** (typos, small clarifications):
- Edit the published prompt directly
- Note changes in the description

**For major changes** (new structure, different approach):
- Create a new draft version
- Test thoroughly
- Update the original only when the new version is proven
- Or publish the new version as a separate prompt with a version suffix (e.g., "Blog Post Template v2")

## Common Use Case Patterns

### Content Marketing

**Blog Post Structure:**
```
@company-voice

Write a blog post about {{topic}}.

**Audience:** {{target_audience}}
**Goal:** {{content_goal}}
**Length:** {{word_count}} words

## Structure
1. Compelling headline
2. Introduction with hook
3. {{section_count}} main sections with examples
4. Practical takeaways
5. Conclusion with CTA

**SEO:** Focus on {{primary_keyword}}
**Tone:** {{tone}}
```

### Software Development

**Pull Request Template:**
```
Create a pull request description:

## Feature
{{feature_name}}

## Changes
{{changes_summary}}

## Why This Change?
{{problem_statement}}

## How It Works
{{solution_approach}}

## Testing
{{testing_approach}}

## Breaking Changes
{{breaking_changes}} (none if not applicable)

## Deployment Notes
{{deployment_notes}} (none if not applicable)

Checklist:
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Backward compatible (or breaking changes documented)
```

### Business Communication

**Meeting Summary:**
```
Summarize this meeting:

**Meeting:** {{meeting_title}}
**Date:** {{date}}
**Attendees:** {{attendees}}

**Raw Notes:**
{{meeting_notes}}

**Format:**

# {{meeting_title}} - Summary

## Key Decisions
- [Decision 1]
- [Decision 2]

## Action Items
- [Action] - Owner: [Name] - Due: [Date]

## Next Steps
[What happens next]

## Parking Lot
[Items tabled for future discussion]

**Tone:** Professional and concise
```

### Customer Support

**Support Response:**
```
@support-tone-guidelines

Write a support response:

**Issue:** {{issue_description}}
**Customer:** {{customer_name}}
**Priority:** {{priority_level}}

**Include:**
1. Acknowledge the issue with empathy
2. Provide clear solution steps
3. Offer additional help if needed
4. Set expectations for next steps

**Tone:** {{tone}}
(Options: empathetic, professional, friendly)
```

## Maintenance Best Practices

### Regular Review Schedule

**Monthly:**
- Review prompts used in the last 30 days
- Update any that produced inconsistent results
- Remove unused test prompts

**Quarterly:**
- Audit entire library for outdated instructions
- Consolidate similar prompts
- Update base prompts based on learnings
- Review and update labeling system

### Documentation Updates

When updating prompts, also update:
- Description field with change summary
- Labels if purpose has shifted
- Slug if name has changed significantly
- References in other prompts

### Breaking Changes

When making breaking changes to a referenced prompt:
1. Search for all prompts that reference it (`@slug-name`)
2. Create a new version of the base prompt instead
3. Or update all dependent prompts to handle the change
4. Document the breaking change in the description

## Security and Privacy

### Avoid Hardcoding Sensitive Data

Never include in prompts:
- API keys or credentials
- Customer names or personal information
- Internal system names or infrastructure details
- Proprietary algorithms or trade secrets

Use variables instead:
```
✅ Connect to {{database_name}} using credentials in {{config_file}}
❌ Connect to prod-db-2.internal.company.com using apikey_12345
```

### Review Shared Prompts

Before sharing prompts with team members:
- Check for embedded sensitive information
- Verify examples don't contain real customer data
- Ensure internal project names are replaced with variables

## Next Steps

- [Explore API integration](/user-guide/prompts/api-integration) for programmatic access
- [Review FAQs](/user-guide/prompts/faq) for common questions
- [Return to overview](/user-guide/prompts) for more information
