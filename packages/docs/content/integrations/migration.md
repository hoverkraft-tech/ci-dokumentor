---
sidebar_position: 7
---

# Migration Guide

This guide helps you migrate from other popular documentation tools to ci-dokumentor using the `migrate` command.

## Migration Philosophy

The ci-dokumentor migrate command is designed as a **bridge solution** to help teams transition smoothly from other documentation tools. This approach is **not about competing** with other excellent tools in the ecosystem, but rather providing a helpful path when:

- Your current tool doesn't perfectly match your specific requirements
- A tool you're using is no longer actively maintained
- You want to standardize on ci-dokumentor's flexible, extensible architecture
- You need better integration with your existing CI/CD workflows

:::note Important
We respect and appreciate the work done by other documentation tool maintainers. The migration functionality exists to provide options and flexibility, not to replace tools that are working well for your team.
:::

## When to Consider Migration

Consider migrating to ci-dokumentor when you encounter these scenarios:

### Tool Maintenance Concerns

- Your current tool hasn't been updated in a long time
- Issues or feature requests aren't being addressed
- Dependencies are outdated or have security vulnerabilities

### Feature Limitations

- You need more customization options than your current tool provides
- You want support for additional CI/CD platforms beyond GitHub Actions
- You require different output formats (JSON, GitHub Actions output, etc.)
- You need better integration with your existing toolchain

### Standardization Needs

- You're managing multiple projects and want consistent documentation patterns
- Your team wants a single tool that can grow with your evolving needs
- You prefer tools with active communities and regular updates

### Integration Requirements

- You need tighter integration with Git workflows
- You want to leverage GitHub API features for enhanced documentation
- You require programmatic access to documentation generation

## Supported Source Tools

Currently, ci-dokumentor can migrate from these popular GitHub Actions documentation tools:

### action-docs

A simple tool for generating action documentation.

**Migration Coverage:**

- Header sections
- Description/Overview sections
- Input parameter documentation
- Output parameter documentation
- Usage examples

### auto-doc

Automatic documentation generator for GitHub Actions.

**Migration Coverage:**

- Section headers (Inputs, Outputs, Secrets, Description)
- Preserves existing content structure
- Maintains section organization

### actdocs

Documentation tool with paired comment markers.

**Migration Coverage:**

- Description sections
- Input/output parameters
- Secret parameter documentation
- Permission/security sections

### github-action-readme-generator

Comprehensive readme generator for GitHub Actions.

**Migration Coverage:**

- Branding and badges
- Title/header sections
- Usage examples
- Complete input/output documentation
- Example code sections

## Migration Process

### Step 1: Preparation

Before starting the migration:

1. **Backup your documentation files**

   ```bash
   cp README.md README.md.backup
   cp docs/api.md docs/api.md.backup
   ```

2. **Review current documentation structure**
   - Identify which files contain auto-generated sections
   - Note any custom content you want to preserve
   - Check for any special formatting or customizations

3. **Choose your target structure**
   - Decide which ci-dokumentor sections you want to use
   - Plan how to organize your documentation sections

### Step 2: Preview Migration

Always preview changes before applying them:

```bash
# Preview what would be migrated
ci-dokumentor migrate --tool action-docs --destination README.md --dry-run

# Check the output carefully
# Look for any unexpected changes or content loss
```

The dry-run mode shows you exactly what changes would be made without modifying any files.

### Step 3: Perform Migration

Once you're satisfied with the preview:

```bash
# Perform the actual migration
ci-dokumentor migrate --tool action-docs --destination README.md

# Verify the changes
git diff README.md.backup README.md
```

### Step 4: Generate Fresh Content

After migration, generate fresh documentation content:

```bash
# Generate current documentation using ci-dokumentor
ci-dokumentor generate --source action.yml --destination README.md

# Review and customize the generated content as needed
```

### Step 5: Review and Finalize

1. **Review generated content**
   - Check that all sections are populated correctly
   - Verify that custom content is preserved
   - Ensure formatting meets your standards

2. **Make manual adjustments**
   - Add any custom sections or content
   - Adjust formatting if needed
   - Update any references or links

3. **Test documentation**
   - Verify that all links work correctly
   - Check that examples are accurate
   - Ensure the documentation builds correctly

## Migration Examples

### Migrating from action-docs

**Before (action-docs format):**

```markdown
# My Action

<!-- action-docs-header source="action.yml" -->
<!-- action-docs-description source="action.yml" -->

## Usage

<!-- action-docs-inputs source="action.yml" -->
<!-- action-docs-outputs source="action.yml" -->
```

**Migration command:**

```bash
ci-dokumentor migrate --tool action-docs --destination README.md
```

**After (ci-dokumentor format):**

```markdown
# My Action

<!-- header:start -->
<!-- header:end -->
<!-- overview:start -->
<!-- overview:end -->

## Usage

<!-- inputs:start -->
<!-- inputs:end -->
<!-- outputs:start -->
<!-- outputs:end -->
```

### Migrating from auto-doc

**Before (auto-doc format):**

```markdown
# My Action

Some description here.

## Inputs

## Outputs

## Secrets
```

**Migration command:**

```bash
ci-dokumentor migrate --tool auto-doc --destination README.md
```

**After (ci-dokumentor format):**

```markdown
# My Action

Some description here.

<!-- inputs:start -->

## Inputs

<!-- inputs:end -->

<!-- outputs:start -->

## Outputs

<!-- outputs:end -->

<!-- secrets:start -->

## Secrets

<!-- secrets:end -->
```

## Post-Migration Benefits

After successful migration, you'll gain access to:

### Enhanced Features

- **Multiple output formats** - Text, JSON, and GitHub Actions output
- **Flexible section management** - Include/exclude specific sections
- **Custom badge support** - Add custom badges alongside auto-generated ones
- **Version-aware examples** - Specify version tags for usage examples

### Better Integration

- **Repository platform support** - Git and GitHub integration with API access
- **CI/CD platform support** - Growing support for multiple platforms
- **Extensible architecture** - Easy to add new generators and formatters

### Active Development

- **Regular updates** - Active development and maintenance
- **Community support** - Growing community and contribution ecosystem
- **Documentation** - Comprehensive documentation and examples

## Troubleshooting

### Common Issues

**Migration doesn't detect source markers:**

- Verify that your documentation files contain the expected marker patterns
- Check that you're using the correct tool name
- Try using `--dry-run` to see what the tool is detecting

**Content is lost during migration:**

- Always backup your files before migration
- Use `--dry-run` to preview changes
- Check that markers are properly paired (start/end markers)

**Generated content doesn't match expectations:**

- Verify your source manifest file (action.yml, etc.) is correct
- Check that ci-dokumentor can properly parse your source file
- Review the generated sections and adjust templates if needed

### Getting Help

If you encounter issues during migration:

1. **Check the documentation** - Review the CLI documentation and examples
2. **Use dry-run mode** - Always preview changes before applying them
3. **Backup your files** - Keep backups of your original documentation
4. **Open an issue** - Report bugs or request features in the ci-dokumentor repository

## Migration Checklist

Use this checklist to ensure a smooth migration:

- [ ] **Backup original documentation files**
- [ ] **Review current tool's output and structure**
- [ ] **Choose appropriate source tool for migration**
- [ ] **Run migration with `--dry-run` flag**
- [ ] **Review proposed changes carefully**
- [ ] **Perform actual migration**
- [ ] **Generate fresh content with ci-dokumentor**
- [ ] **Review and test generated documentation**
- [ ] **Make any necessary manual adjustments**
- [ ] **Update CI/CD workflows if needed**
- [ ] **Document the change for your team**

## Next Steps

After successful migration:

1. **Explore advanced features** - Check out section management, custom badges, and output formats
2. **Integrate with CI/CD** - Set up automated documentation updates in your workflows
3. **Customize templates** - Adjust documentation templates to match your team's style
4. **Contribute back** - Consider contributing improvements or new features to ci-dokumentor

---

**Remember**: Migration is a bridge to help you transition smoothly. The goal is to provide you with a tool that grows with your needs while respecting the excellent work done by other tool maintainers in the ecosystem.
