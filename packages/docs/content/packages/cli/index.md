---
title: CLI Package
description: Command-line interface for generating documentation from CI/CD manifest files.
sidebar_position: 2
---

The `@ci-dokumentor/cli` package provides a command-line interface for generating documentation from CI/CD manifest files.

## Overview

The CLI package provides:

- **Generate Command** - Main command for documentation generation
- **Migrate Command** - Bridge tool for transitioning from other documentation tools
- **Platform Auto-detection** - Automatically detects supported CI/CD platforms
- **Repository Integration** - Works with Git and GitHub repositories
- **Configurable Output** - Flexible output options and sections
- **Output Format Selection** - Choose between text, JSON, or GitHub Action output formats

## Installation

### Global Installation

For end users who prefer a global install (creates a `ci-dokumentor` executable on PATH):

```bash
# Using npm
npm install -g @ci-dokumentor/cli
ci-dokumentor --help

# or using pnpm (global install)
pnpm add -g @ci-dokumentor/cli
ci-dokumentor --help
```

### Local Installation

Install as a dev dependency for project-local usage:

```bash
# npm
npm install --save-dev @ci-dokumentor/cli

# pnpm (preferred in this monorepo)
pnpm add -D @ci-dokumentor/cli

# Run via npx or pnpm
npx ci-dokumentor --help
pnpm dlx ci-dokumentor --help
```

> Note: This repository uses pnpm workspaces. For contributors, prefer using pnpm commands and workspace builds (see Developer section).

### Using NPX (No Installation)

```bash
npx ci-dokumentor --help
```

## Global Options

The CLI provides global options that can be used with any command:

| Option                     | Alias | Description                                                 | Default |
| -------------------------- | ----- | ----------------------------------------------------------- | ------- |
| `--output-format <format>` | -     | Output format for the CLI (`text`, `json`, `github-action`) | `text`  |

### Output Format

The `--output-format` option controls how the CLI outputs information and results:

- **`text`** (default) - Traditional console output with emojis and formatting
- **`json`** - Structured JSON output for programmatic processing
- **`github-action`** - GitHub Actions workflow-compatible output using workflow commands

Examples:

```bash
# Default text output
ci-dokumentor generate -s action.yml

# JSON output for programmatic processing
ci-dokumentor --output-format json generate -s action.yml

# GitHub Action output for CI workflows
ci-dokumentor --output-format github-action generate -s action.yml
```

## Commands

### Help Command

Get detailed help for any command.

```bash
# General help
ci-dokumentor help
ci-dokumentor --help

# Command-specific help
ci-dokumentor help generate
ci-dokumentor generate --help
```

### Version Command

Display version information.

```bash
ci-dokumentor --version
ci-dokumentor -v
```

### Migrate Command

The migrate command helps you transition existing documentation from other popular tools to ci-dokumentor's standardized format. This command is designed as a **bridge solution** to help you move from tools that may not perfectly fit your needs or are no longer actively maintained.

:::note Migration Philosophy
The migrate command is **not intended to compete** with other excellent documentation tools. Instead, it serves as a helpful bridge when:

- Your current tool doesn't perfectly match your specific requirements
- A tool you're using is no longer actively maintained
- You want to standardize on ci-dokumentor's flexible, extensible architecture
- You need better integration with your existing CI/CD workflows
  :::

**Command:** `migrate`

#### Basic Usage - `migrate`

```bash
# Migrate from action-docs tool (single file)
ci-dokumentor migrate --tool action-docs --destination README.md

# Migrate multiple files
ci-dokumentor migrate --tool action-docs --destination file1.md --destination file2.md

# Migrate all README files using glob pattern
ci-dokumentor migrate --tool action-docs --destination "**/README.md"

# Preview changes without writing (dry-run)
ci-dokumentor migrate --tool auto-doc --destination docs/README.md --dry-run

# Migrate with specific output format
ci-dokumentor --output-format json migrate --tool actdocs --destination README.md

# Migrate multiple files with custom concurrency
ci-dokumentor migrate --tool action-docs --destination "**/README.md" --concurrency 10
```

#### Command Options - `migrate`

| Option                      | Alias | Description                                                                         | Default    |
| --------------------------- | ----- | ----------------------------------------------------------------------------------- | ---------- |
| `--tool <tool>`             | `-t`  | Migration tool to convert from (optional, can be auto-detected)                     | -          |
| `--destination <file...>`   | `-d`  | Destination file(s) containing documentation markers to migrate. Supports glob patterns and multiple files. | (required) |
| `--concurrency [number]`    | -     | Maximum number of files to process concurrently when processing multiple files      | `5`        |
| `--dry-run`                 | -     | Preview what would be migrated without writing files                                | `false`    |

#### Supported Migration Tools

The migrate command supports migrating from these popular GitHub Actions documentation tools:

##### action-docs

Converts action-docs markers to ci-dokumentor format:

- `<!-- action-docs-header source="action.yml" -->` → `<!-- header:start -->`
- `<!-- action-docs-description source="action.yml" -->` → `<!-- overview:start -->`
- `<!-- action-docs-inputs source="action.yml" -->` → `<!-- inputs:start -->`
- `<!-- action-docs-outputs source="action.yml" -->` → `<!-- outputs:start -->`
- `<!-- action-docs-runs source="action.yml" -->` → `<!-- usage:start -->`

```bash
ci-dokumentor migrate --tool action-docs --destination README.md
```

##### auto-doc

Converts auto-doc headers to ci-dokumentor format:

- `## Inputs` → `<!-- inputs:start -->\n## Inputs\n<!-- inputs:end -->`
- `## Outputs` → `<!-- outputs:start -->\n## Outputs\n<!-- outputs:end -->`
- `## Secrets` → `<!-- secrets:start -->\n## Secrets\n<!-- secrets:end -->`
- `## Description` → `<!-- overview:start -->\n## Description\n<!-- overview:end -->`

```bash
ci-dokumentor migrate --tool auto-doc --destination README.md
```

##### actdocs

Converts actdocs paired markers to ci-dokumentor format:

- `<!-- actdocs description start -->` / `<!-- actdocs description end -->` → `<!-- overview:start -->` / `<!-- overview:end -->`
- `<!-- actdocs inputs start -->` / `<!-- actdocs inputs end -->` → `<!-- inputs:start -->` / `<!-- inputs:end -->`
- `<!-- actdocs secrets start -->` / `<!-- actdocs secrets end -->` → `<!-- secrets:start -->` / `<!-- secrets:end -->`
- `<!-- actdocs outputs start -->` / `<!-- actdocs outputs end -->` → `<!-- outputs:start -->` / `<!-- outputs:end -->`
- `<!-- actdocs permissions start -->` / `<!-- actdocs permissions end -->` → `<!-- security:start -->` / `<!-- security:end -->`

```bash
ci-dokumentor migrate --tool actdocs --destination README.md
```

##### github-action-readme-generator

Converts GitHub Action readme Generator markers to ci-dokumentor format:

- `<!-- start branding -->` / `<!-- end branding -->` → `<!-- badges:start -->` / `<!-- badges:end -->`
- `<!-- start title -->` / `<!-- end title -->` → `<!-- header:start -->` / `<!-- header:end -->`
- `<!-- start description -->` / `<!-- end description -->` → `<!-- overview:start -->` / `<!-- overview:end -->`
- `<!-- start usage -->` / `<!-- end usage -->` → `<!-- usage:start -->` / `<!-- usage:end -->`
- `<!-- start inputs -->` / `<!-- end inputs -->` → `<!-- inputs:start -->` / `<!-- inputs:end -->`
- `<!-- start outputs -->` / `<!-- end outputs -->` → `<!-- outputs:start -->` / `<!-- outputs:end -->`
- `<!-- start [.github/ghadocs/examples/] -->` / `<!-- end [...] -->` → `<!-- examples:start -->` / `<!-- examples:end -->`

```bash
ci-dokumentor migrate --tool github-action-readme-generator --destination README.md
```

#### Migration Workflow

The typical migration workflow follows these steps:

1. **Backup your documentation**: Always backup your existing documentation files before migration
2. **Preview changes**: Use `--dry-run` to see what would be changed
3. **Migrate markers**: Run the migration command to convert existing markers
4. **Generate fresh content**: Use `ci-dokumentor generate` to populate the new markers with current content
5. **Review and customize**: Review the generated content and make any manual adjustments

Example complete workflow:

```bash
# 1. Backup your README
cp README.md README.md.backup

# 2. Preview migration changes
ci-dokumentor migrate --tool action-docs --destination README.md --dry-run

# 3. Perform migration
ci-dokumentor migrate --tool action-docs --destination README.md

# 4. Generate fresh documentation content
ci-dokumentor generate --source action.yml --destination README.md

# 5. Review the results
git diff README.md.backup README.md
```

#### When to Use Migration

Consider using the migrate command when:

- **Transitioning from another tool**: You're already using a documentation tool but want to switch to ci-dokumentor
- **Tool maintenance concerns**: Your current tool is no longer actively maintained or has limited support
- **Need more flexibility**: You need features or customization options not available in your current tool
- **Standardization**: You want to standardize documentation across multiple projects using ci-dokumentor
- **Better CI/CD integration**: You need tighter integration with your existing CI/CD pipelines

#### Migration Benefits

After migration, you'll gain access to ci-dokumentor's features:

- **Extensible architecture** - Easy to add new platforms and generators
- **Multiple output formats** - Support for text, JSON, and GitHub Actions output
- **Active maintenance** - Regular updates and community support
- **Repository integration** - Deep integration with Git and GitHub features
- **Flexible templates** - Customizable section templates and formatting
- **Comprehensive platform support** - Growing support for multiple CI/CD platforms

### Generate Command

The main command for generating documentation from CI/CD files.

**Aliases:** `generate`, `gen`

#### Basic Usage - `generate`

```bash
# Generate documentation for a single manifest file
ci-dokumentor generate --source ./my-project/action.yml

# Generate documentation for multiple files
ci-dokumentor generate --source action1.yml --source action2.yml

# Generate documentation using glob patterns
ci-dokumentor generate --source "*.yml"
ci-dokumentor generate --source ".github/workflows/*.yml"

# Generate with specific source and explicit destination (single file only)
ci-dokumentor generate --source ./my-project/action.yml --destination ./my-docs/README.md

# Generate with JSON output format
ci-dokumentor --output-format json generate --source ./my-project/action.yml

# Control concurrency when processing multiple files
ci-dokumentor generate --source "*.yml" --concurrency 10
```

#### Command Options - `generate`

| Option                          | Alias | Description                                                                                        | Default    |
| ------------------------------- | ----- | -------------------------------------------------------------------------------------------------- | ---------- |
| `--source <file...>`            | `-s`  | Source manifest file path(s) to handle. Supports glob patterns and multiple files.                 | (required) |
| `--destination <file>`          | `-d`  | Destination file path for generated documentation (auto-detected if not specified). Only applicable when processing a single file. | -          |
| `--repository <platform>`       | `-r`  | Repository platform (auto-detected if not specified)                                               | -          |
| `--cicd <platform>`             | `-c`  | CI/CD platform (auto-detected if not specified)                                                    | -          |
| `--include-sections <sections>` | -     | Comma-separated list of sections to include                                                        | -          |
| `--exclude-sections <sections>` | -     | Comma-separated list of sections to exclude                                                        | -          |
| `--format-link [type]`          | -     | Transform bare URLs to links (`auto`, `full`, `false`)                                             | `auto`     |
| `--concurrency [number]`        | -     | Maximum number of files to process concurrently when processing multiple files                     | `5`        |
| `--dry-run`                     | -     | Preview what would be generated without writing files                                              | `false`    |

#### URL Link Formatting

The `--format-link` option controls how bare URLs in text content are transformed in the generated documentation:

**Option Values:**

- `auto` - Transforms URLs to autolinks: `<https://example.com>`
- `full` - Transforms URLs to full Markdown links: `[https://example.com](https://example.com)`
- `false` - Disables URL transformation (preserves original bare URLs)

**Behavior:**

- When option is not provided: No URL transformation (backward compatible)
- Only transforms `http://` and `https://` URLs
- Preserves existing Markdown links to avoid double-processing
- Handles URLs with trailing punctuation correctly (.,;!?)
- Supports mixed content with both existing links and standalone URLs

**Examples:**

```bash
# Transform URLs to autolinks (default when option used)
ci-dokumentor generate --source action.yml --format-link auto
# Input:  "Visit https://example.com for more info"
# Output: "Visit <https://example.com> for more info"

# Transform URLs to full markdown links
ci-dokumentor generate --source action.yml --format-link full
# Input:  "Visit https://example.com for more info"
# Output: "Visit [https://example.com](https://example.com) for more info"

# Explicitly disable URL transformation
ci-dokumentor generate --source action.yml --format-link false
# Input:  "Visit https://example.com for more info"
# Output: "Visit https://example.com for more info"

# No transformation (backward compatible)
ci-dokumentor generate --source action.yml
# Input:  "Visit https://example.com for more info"
# Output: "Visit https://example.com for more info"
```

**Smart URL Detection:**

The URL transformation feature includes intelligent handling:

- Preserves existing Markdown links: `[GitHub](https://github.com)` remains unchanged
- Handles punctuation: `Visit https://example.com.` → `Visit <https://example.com>.`
- Processes multiple URLs: `See https://github.com and https://stackoverflow.com`
- Only processes `http://` and `https://` protocols for security

#### Platform-Specific Options

Depending on the detected or specified platform, additional options may be available:

**GitHub Actions Platform:**

- `--extra-badges <badges>` - Additional badges to include as JSON array of badge objects
- `--version <version>` - Version identifier for usage examples (tag, branch, commit SHA)
- `--github-token <token>` - GitHub token for API access (env: `GITHUB_TOKEN`)

#### Supported Platforms

Some extra options may be available depending on the specific repository or CI/CD manifest.

Depending on the context, the following platforms are supported:

**Repository Platforms:**

- [`git`](/packages/repository/git/) - Git repository support
- [`github`](/packages/repository/github/) - GitHub-specific features

**CI/CD Platforms:**

- [`github-actions`](/packages/cicd/github-actions/) - GitHub Actions workflows and action files

#### Examples

```bash
# Generate documentation for a specific manifest file
ci-dokumentor generate --source ./actions/action.yml

# Generate documentation for multiple files
ci-dokumentor generate --source action1.yml --source action2.yml

# Generate documentation for all YAML files using glob pattern
ci-dokumentor generate --source "*.yml"

# Generate documentation for all GitHub workflow files
ci-dokumentor generate --source ".github/workflows/*.yml"

# Generate with explicit destination (single file only)
ci-dokumentor generate --source ./actions/action.yml --destination ./action-docs/README.md

# Specify platforms explicitly
ci-dokumentor generate --source ./actions/action.yml --repository github --cicd github-actions --github-token xxx

# Generate with different output formats
ci-dokumentor --output-format json generate --source ./actions/action.yml
ci-dokumentor --output-format github-action generate --source ./actions/action.yml

# Preview changes without writing files (dry run)
ci-dokumentor generate --source ./actions/action.yml --dry-run

# Process multiple files with custom concurrency
ci-dokumentor generate --source "*.yml" --concurrency 10

# Add custom badges to the badges section
ci-dokumentor generate --source ./actions/action.yml --extra-badges '[
  {
    "label": "Coverage",
    "url": "https://img.shields.io/badge/coverage-90%25-green",
  },
  {
    "label": "Build Status",
    "url": "https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml",
    "linkUrl": "https://github.com/owner/repo/actions"
  }
]'
```

#### Extra Badges Configuration

The `--extra-badges` option allows you to add custom badges to the badges section alongside the automatically generated ones. This is useful for adding coverage badges, build status from external CI systems, or other custom indicators.

**Badge Object Format:**

Each badge object must include:

- `label` (string) - The display text for the badge
- `url` (string) - The badge image URL (typically from shields.io or CI/CD platform)
- `linkUrl` (string) - (optional) The URL to navigate to when the badge is clicked

**JSON Format:**

The badges must be provided as a JSON array. You can format it across multiple lines for readability:

```bash
ci-dokumentor generate --source action.yml --extra-badges '[
  {
    "label": "My Badge",
    "url": "https://img.shields.io/badge/my-badge-blue",
    "linkUrl": "https://example.com"
  }
]'
```

**Common Use Cases:**

- Code coverage badges from external services
- Build status from non-GitHub CI systems
- Quality metrics (code quality, security scores)
- Version badges from package registries
- Custom project status indicators

#### Multiple files

The CLI supports processing multiple files in a single invocation using:

**Direct specification:**
```bash
# Multiple source files
ci-dokumentor generate --source action1.yml --source action2.yml

# Multiple destination files for migration
ci-dokumentor migrate --destination file1.md --destination file2.md
```

**Glob patterns:**
```bash
# Process all YAML files in the current directory
ci-dokumentor generate --source "*.yml"

# Process all workflow files
ci-dokumentor generate --source ".github/workflows/*.yml"

# Process all README files for migration
ci-dokumentor migrate --tool action-docs --destination "**/README.md"
```

**Concurrency control:**
```bash
# Process files with custom concurrency (default is 5)
ci-dokumentor generate --source "*.yml" --concurrency 10

# Process files sequentially
ci-dokumentor generate --source "*.yml" --concurrency 1
```

**Important notes:**
- When processing multiple files, the `--destination` option cannot be used for generate command (destinations are auto-detected)
- Common options (repository, cicd, sections, etc.) are applied to all files
- Files are processed concurrently for better performance
- Errors in individual files are reported at the end without stopping the entire process

#### Section Configuration

The CLI supports including/excluding specific documentation sections:

**Common Sections (varies by platform):**

- `badges` - Shields.io badges, marketplace links, and custom badges
- `overview` - General information
- `inputs` - Input parameters
- `outputs` - Output values
- `usage` - Usage examples
- `examples` - Code examples

Use `ci-dokumentor generate --help` with a source file to see all available sections and platform-specific options.

**Section-Specific Options:**

Some sections support additional configuration options:

- **`badges`** - Use `--extra-badges` to add custom badges alongside auto-generated ones
- **`usage`** - Use `--version` to specify which version to use in usage examples

## CLI Architecture

The CLI is built with:

- **Commander.js** - Command-line parsing and help generation
- **InversifyJS** - Dependency injection
- **Clean Architecture** - Separated concerns and testable components

### Core Components

#### CliApplication

Main application class that orchestrates command execution:

```typescript
class CliApplication {
  async run(args?: string[]): Promise<void>;
}
```

#### GenerateCommand

Implements the generate command:

```typescript
class GenerateCommand extends BaseCommand {
  configure(): this; // Sets up command options and action
}
```

#### GenerateDocumentationUseCase

Business logic for documentation generation:

```typescript
class GenerateDocumentationUseCase {
  execute(
    input: GenerateDocumentationUseCaseInput,
  ): Promise<GenerateDocumentationUseCaseOutput>;
  getSupportedRepositoryPlatforms(): string[];
  getSupportedCicdPlatforms(): string[];
}
```

## Error Handling

The CLI provides helpful error messages for common issues:

- **Invalid platform names** - Shows available platforms
- **Missing CI/CD files** - Suggests checking the source directory
- **Permission errors** - Provides guidance for file system issues

## Exit Codes

| Code | Meaning                                                 |
| ---- | ------------------------------------------------------- |
| `0`  | Success                                                 |
| `1`  | General error (invalid arguments, file not found, etc.) |

## Development

### Building and testing

Build and test the CLI via the workspace commands so behavior matches the actual package configuration. Examples:

- Build the CLI: `nx build cli` or run the workspace build with `pnpm build`.
- Run tests for the CLI package: `nx test cli` or run all package tests with `pnpm test`.
- After building, the CLI entrypoint is `packages/cli/dist/bin/ci-dokumentor.js` — refer to this file when documenting CLI runtime behavior rather than copying runtime snippets into docs.

## Related Packages

- [Core Package](/packages/core/) - Core services and interfaces
- [Repository Git](/packages/repository/git/) - Git repository provider
- [Repository GitHub](/packages/repository/github/) - GitHub repository provider
- [CI/CD GitHub Actions](/packages/cicd/github-actions/) - GitHub Actions support
