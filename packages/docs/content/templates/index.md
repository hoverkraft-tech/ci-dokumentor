---
title: Templates
description: Ready-to-use documentation templates for all supported CI/CD platforms
sidebar_position: 4
---

This section provides ready-to-use documentation templates that you can copy and customize for your projects.

## Available Templates

### CI/CD Platform Templates

- [🐙 **GitHub Actions**](./github-actions-template.md) — Complete template with all available sections for GitHub Actions and workflows
- [🦊 **GitLab CI**](./gitlab-template.md) — Template for GitLab CI components _(planned for future development)_
- [🗡️ **Dagger.io**](./dagger-template.md) — Template for Dagger modules _(planned for future development)_

## How to Use Templates

1. **Choose the appropriate template** for your CI/CD platform
2. **Copy the template content** to your README.md or documentation file
3. **Remove unused sections** that don't apply to your project
4. **Add your custom content** outside the marker regions
5. **Run CI Dokumentor** to populate the marked sections with generated content

## Template Structure

All templates follow this consistent pattern:

```markdown
# Your Project Title

Your custom description and content here.

<!-- section-name:start -->
<!-- section-name:end -->

More custom content outside markers remains unchanged.
```

### Marker Conventions

- **Section markers** use the format `<!-- section-name:start -->` and `<!-- section-name:end -->`
- **Content inside markers** is replaced by CI Dokumentor during generation
- **Content outside markers** is preserved and remains unchanged
- **Unused sections** can be safely removed from templates

## Example Workflow

```bash
# 1. Copy template to your project
cp template.md README.md

# 2. Customize the template (add your content outside markers)
vim README.md

# 3. Generate documentation
ci-dokumentor generate --source action.yml --destination README.md

# 4. Review and commit the generated documentation
git add README.md
git commit -m "docs: add generated documentation"
```

## Customization Tips

### Section Selection

Only include sections that are relevant to your project:

```markdown
<!-- For actions with inputs and outputs -->
<!-- inputs:start -->
<!-- inputs:end -->
<!-- outputs:start -->
<!-- outputs:end -->

<!-- For actions without secrets, remove this section -->
<!-- Remove: secrets:start/end markers -->
```

## Related Documentation

- 📖 [CLI Documentation](../packages/cli/) — Complete command reference and options
- 🔧 [Integration Guides](../integrations/) — Platform-specific setup and usage
- 🏗️ [Architecture Guide](../developers/architecture.md) — Understanding how templates work internally
