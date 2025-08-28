---
sidebar_position: 2
---

# CLI Package

The `@ci-dokumentor/cli` package provides a command-line interface for generating documentation from CI/CD configuration files.

## Overview

The CLI package provides:

- **Generate Command** - Main command for documentation generation
- **Platform Auto-detection** - Automatically detects supported CI/CD platforms
- **Repository Integration** - Works with Git and GitHub repositories
- **Configurable Output** - Flexible output options and sections

## Installation

### Global Installation

```bash
npm install -g @ci-dokumentor/cli
ci-dokumentor --help
```

### Local Installation

```bash
npm install --save-dev @ci-dokumentor/cli
npx ci-dokumentor --help
```

### Using NPX (No Installation)

```bash
npx ci-dokumentor --help
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

### Generate Command

The main command for generating documentation from CI/CD files.

**Aliases:** `generate`, `gen`

#### Basic Usage

```bash
# Generate documentation for a single manifest file (required)
ci-dokumentor generate --source ./my-project/action.yml

# Generate with specific source and explicit output
ci-dokumentor generate --source ./my-project/action.yml --output ./my-docs
```

#### Command Options

| Option                          | Alias | Description                                                                                                      | Default    |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| `--source <file>`               | `-s`  | Source manifest file path to handle (e.g. `action.yml`, `.github/workflows/ci.yml`)                              | (required) |
| `--output <dir>`                | `-o`  | Output path for generated documentation (optional; destination is auto-detected if not specified by the adapter) | -          |
| `--repository <platform>`       | `-r`  | Repository platform (auto-detected if not specified)                                                             | -          |
| `--cicd <platform>`             | `-c`  | CI/CD platform (auto-detected if not specified)                                                                  | -          |
| `--include-sections <sections>` | -     | Comma-separated list of sections to include                                                                      | -          |
| `--exclude-sections <sections>` | -     | Comma-separated list of sections to exclude                                                                      | -          |

#### Supported Platforms

**Repository Platforms:**

- `git` - Git repository support
- `github` - GitHub-specific features

**CI/CD Platforms:**

- `github-actions` - GitHub Actions workflows and action files

#### Examples

```bash
# Generate documentation for a specific manifest file
ci-dokumentor generate --source ./actions/action.yml

# Generate with explicit output
ci-dokumentor generate --source ./actions/action.yml --output ./action-docs

# Specify platforms explicitly
ci-dokumentor generate --source ./actions/action.yml --repository github --cicd github-actions
```

#### Multiple files

The CLI handles a single manifest file per invocation. To generate documentation for multiple files, script multiple invocations. For example:

```bash
for f in action.yml .github/workflows/*.yml; do
  ci-dokumentor generate --source "$f" --output "docs/$(basename "$f" .yml)" || true
done
```

#### Section Configuration

The CLI supports including/excluding specific documentation sections:

**Common Sections (varies by platform):**

- `overview` - General information
- `inputs` - Input parameters
- `outputs` - Output values
- `usage` - Usage examples
- `examples` - Code examples

Use `ci-dokumentor generate --help` to see platform-specific sections.

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

- [Core Package](./core) - Core services and interfaces
- [Repository Git](./repository-git) - Git repository provider
- [Repository GitHub](./repository-github) - GitHub repository provider
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions support
