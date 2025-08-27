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

### Generate Command

The main command for generating documentation from CI/CD files.

**Aliases:** `generate`, `gen`

#### Basic Usage

```bash
# Generate documentation for current directory
ci-dokumentor generate

# Generate with specific source and output
ci-dokumentor generate --source ./my-project --output ./my-docs
```

#### Command Options

| Option                          | Alias | Description                                          | Default  |
| ------------------------------- | ----- | ---------------------------------------------------- | -------- |
| `--source <dir>`                | `-s`  | Source directory containing CI/CD files              | `.`      |
| `--output <dir>`                | `-o`  | Output directory for generated documentation         | `./docs` |
| `--repository <platform>`       | `-r`  | Repository platform (auto-detected if not specified) | -        |
| `--cicd <platform>`             | `-c`  | CI/CD platform (auto-detected if not specified)      | -        |
| `--include-sections <sections>` | -     | Comma-separated list of sections to include          | -        |
| `--exclude-sections <sections>` | -     | Comma-separated list of sections to exclude          | -        |

#### Supported Platforms

**Repository Platforms:**

- `git` - Git repository support
- `github` - GitHub-specific features

**CI/CD Platforms:**

- `github-actions` - GitHub Actions workflows and action files

#### Examples

```bash
# Auto-detect everything
ci-dokumentor generate

# Specify platforms explicitly
ci-dokumentor generate --repository github --cicd github-actions

# Include only specific sections
ci-dokumentor generate --include-sections "overview,inputs,outputs"

# Exclude specific sections
ci-dokumentor generate --exclude-sections "examples,troubleshooting"

# Generate to specific output directory
ci-dokumentor generate --source ./actions --output ./action-docs
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

### Basic Examples

```bash
# Basic usage
ci-dokumentor generate action.yml

# Generate documentation for a workflow
ci-dokumentor generate .github/workflows/ci.yml

# Generate with custom output location
ci-dokumentor generate action.yml --output docs/
```

#### Advanced Usage

```bash
# Generate for multiple files
ci-dokumentor generate action.yml .github/workflows/*.yml

# Specify CI/CD platform type
ci-dokumentor generate --type github-actions action.yml

# Include repository information
ci-dokumentor generate --include-repo-info action.yml

# Custom template variables
ci-dokumentor generate --author "My Team" --license "MIT" action.yml
```

#### Options

| Option                | Short | Description                  | Default         |
| --------------------- | ----- | ---------------------------- | --------------- |
| `--output`            | `-o`  | Output directory or file     | `./docs`        |
| `--type`              | `-t`  | CI/CD platform type          | `auto-detect`   |
| `--author`            | `-a`  | Override author information  | From manifest   |
| `--license`           | `-l`  | Override license information | From repository |
| `--include-repo-info` |       | Include repository metadata  | `false`         |
| `--template`          |       | Custom template file         | Built-in        |
| `--format`            | `-f`  | Output format                | `markdown`      |
| `--verbose`           | `-v`  | Verbose logging              | `false`         |

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

## Configuration

### Configuration File

Create a `.ci-dokumentor.json` file in your project root:

```json
{
  "output": "./docs",
  "type": "github-actions",
  "author": "My Team",
  "license": "MIT",
  "includeRepoInfo": true,
  "template": "./templates/custom.md",
  "format": "markdown"
}
```

### Environment Variables

Override configuration with environment variables:

```bash
# Set default output directory
export CI_DOKUMENTOR_OUTPUT=./docs

# Set default author
export CI_DOKUMENTOR_AUTHOR="My Team"

# Enable verbose logging
export CI_DOKUMENTOR_VERBOSE=true
```

## Architecture

The CLI follows clean architecture principles with clear separation of concerns:

### Architecture Core Components

#### Command Interface

```typescript
interface ICommand {
  name: string;
  description: string;
  execute(args: string[]): Promise<void>;
}
```

#### Command Registry

```typescript
interface ICommandRegistry {
  register(command: ICommand): void;
  get(name: string): ICommand | undefined;
  getAll(): ICommand[];
}
```

#### CLI Application

```typescript
interface ICliApplication {
  run(args: string[]): Promise<void>;
  addCommand(command: ICommand): void;
}
```

### Command Implementation

#### Base Command

```typescript
abstract class BaseCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}

  abstract execute(args: string[]): Promise<void>;

  protected parseOptions(args: string[]): ParsedOptions {
    // Common option parsing logic
  }

  protected validateInputs(options: ParsedOptions): void {
    // Common validation logic
  }
}
```

#### Generate Command Implementation

```typescript
class GenerateCommand extends BaseCommand {
  constructor(
    private readonly documentationService: DocumentationService,
    private readonly repositoryService: RepositoryService,
  ) {
    super('generate', 'Generate documentation from CI/CD files');
  }

  async execute(args: string[]): Promise<void> {
    const options = this.parseOptions(args);
    this.validateInputs(options);

    // Generate documentation
    const manifest = await this.parseManifest(options.input);
    const repository = await this.getRepository(options);
    const documentation = await this.generateDocumentation(
      manifest,
      repository,
    );

    await this.writeOutput(documentation, options.output);
  }
}
```

### Dependency Injection Setup

```typescript
// Container configuration
function initContainer(): Container {
  const container = new Container();

  // Bind core services
  container
    .bind<IRepositoryService>(TYPES.RepositoryService)
    .to(RepositoryService);

  container
    .bind<IDocumentationService>(TYPES.DocumentationService)
    .to(DocumentationService);

  // Bind commands
  container
    .bind<ICommand>(TYPES.Command)
    .to(GenerateCommand)
    .whenTargetNamed('generate');

  container
    .bind<ICommand>(TYPES.Command)
    .to(HelpCommand)
    .whenTargetNamed('help');

  // Bind CLI application
  container.bind<ICliApplication>(TYPES.CliApplication).to(CliApplication);

  return container;
}
```

## CLI Error Handling

The CLI provides comprehensive error handling with helpful messages:

### Common Errors

```typescript
// File not found
class FileNotFoundError extends CliError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', 1);
  }
}

// Invalid configuration
class InvalidConfigError extends CliError {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`, 'INVALID_CONFIG', 2);
  }
}

// Permission denied
class PermissionError extends CliError {
  constructor(path: string) {
    super(`Permission denied: ${path}`, 'PERMISSION_DENIED', 3);
  }
}
```

### Error Output

```bash
# Example error output
Error: File not found: action.yml
  at GenerateCommand.execute (/path/to/cli.js:123:45)

Suggestion: Make sure the file path is correct and the file exists.

Usage: ci-dokumentor generate <file> [options]
```

## Use Cases

### Local Development

```bash
# Generate docs during development
ci-dokumentor generate action.yml --output docs/

# Watch for changes (with external tool)
watch "ci-dokumentor generate action.yml --output docs/" action.yml
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Generate Documentation

on:
  push:
    paths: ['action.yml', '.github/workflows/*.yml']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate Documentation
        run: npx ci-dokumentor generate action.yml --output docs/

      - name: Commit Documentation
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git diff --staged --quiet || git commit -m "docs: update generated documentation"
          git push
```

#### GitLab CI

```yaml
generate-docs:
  stage: docs
  image: node:20-alpine
  script:
    - npm install -g @ci-dokumentor/cli
    - ci-dokumentor generate action.yml --output docs/
  artifacts:
    paths:
      - docs/
  rules:
    - changes:
        - action.yml
        - .gitlab-ci.yml
```

### NPM Scripts Integration

```json
{
  "scripts": {
    "docs:generate": "ci-dokumentor generate action.yml",
    "docs:watch": "watch 'npm run docs:generate' action.yml",
    "docs:build": "npm run docs:generate && docusaurus build",
    "precommit": "npm run docs:generate && git add docs/"
  }
}
```

### Makefile Integration

```makefile
.PHONY: docs docs-watch docs-clean

docs:
    ci-dokumentor generate action.yml --output docs/

docs-watch:
    watch make docs

docs-clean:
    rm -rf docs/

docs-serve: docs
    cd docs && python -m http.server 8000
```

## CLI Testing

Testing for the CLI package is implemented under `packages/cli/src` using Vitest. Tests include unit tests for command classes, integration tests that exercise command wiring, and end-to-end tests that run the built CLI binary.

Run tests via the workspace scripts:

- Run all tests: `pnpm test`
- Run CLI package tests only: `nx test cli`

For testing guidance and canonical test commands, see the centralized developer testing guide: `../developers/testing` (located at `packages/docs/content/developers/testing.md`).

When you need concrete examples, link to the authoritative spec files under `packages/cli/src/**/*.spec.ts` rather than embedding full test code in the docs.

## Building and Development

### Build Commands

```bash
# Build the CLI package
nx build cli

# Run in development mode
nx serve cli

# Run tests
nx test cli

# Run linting
nx lint cli
```

### Development Setup

```bash
# Clone repository
git clone https://github.com/hoverkraft-tech/ci-dokumentor.git
cd ci-dokumentor

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI for local development
cd packages/cli
npm link

# Use locally linked CLI
ci-dokumentor --help
```

## Contributing

When contributing to the CLI package:

1. **Follow Architecture Patterns** - Use the established command and service patterns
2. **Add Tests** - Include unit and integration tests for new commands
3. **Update Documentation** - Add documentation for new features
4. **Type Safety** - Ensure all code is properly typed
5. **Error Handling** - Provide helpful error messages

### Adding New Commands

1. **Create Command Class**:

```typescript
class MyCommand extends BaseCommand {
  constructor() {
    super('my-command', 'Description of my command');
  }

  async execute(args: string[]): Promise<void> {
    // Implementation
  }
}
```

2. **Register in Container**:

```typescript
container
  .bind<ICommand>(TYPES.Command)
  .to(MyCommand)
  .whenTargetNamed('my-command');
```

3. **Add Tests**:

Add unit and integration tests beside the implementation in `packages/cli/src`. Reference the spec file paths in docs rather than embedding full test code.

## CLI Related Packages

- [Core Package](./core) - Foundation services and abstractions
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions support
- [Repository Git](./repository-git) - Git repository provider
- [Repository GitHub](./repository-github) - GitHub-specific features
