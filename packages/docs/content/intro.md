---
sidebar_position: 1
---

# Introduction

Welcome to **CI Dokumentor** - an automated documentation generator for CI/CD components.

## What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that automatically generates comprehensive, professional documentation for your CI/CD manifests (workflows, actions, components, configurations...). It supports multiple CI/CD platforms and repository providers, making it easy to maintain up-to-date documentation for your DevOps processes.

### Key Features

- 📖 **Automated Generation** - Convert CI/CD manifest files into professional documentation
- ⚙️ **Command-line tool** — Lightweight, fast, scriptable, and easy to integrate into local workflows or CI pipelines.
- 🔧 **Extensible Design** - Easy to add support for new CI/CD platforms
- 🐳 **Docker Ready** - Available as a Docker image for easy integration
- 🚀 **GitHub Action** - Can be used directly in GitHub workflows
- 📦 **Node.js Package** - Installable via npm for local or CI/CD usage

## Quick Start

### Run Locally

#### Installation

Choose your preferred installation method:

**Docker (Recommended):**

```bash
docker pull ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
```

**NPX (No Installation):**

```bash
npx ci-dokumentor --help
```

**NPM Global:**

```bash
# Using npm
npm install -g @ci-dokumentor/cli

# or using pnpm (global install)
pnpm add -g @ci-dokumentor/cli
```

:::note
For end users we recommend Docker or NPX for quick, reproducible runs. For contributors working in this repository prefer pnpm workspace commands and building the CLI locally.
:::

:::tip
**📖 Full Documentation**: For more details on integrations, see our [**Integrations documentation**](./integrations/index.md).
:::

#### Generate Your First Documentation

Create a simple GitHub Action file and generate its documentation:

```yaml title="action.yml"
name: 'Hello World Action'
description: 'A simple action that greets the world'
inputs:
  who-to-greet:
    description: 'Who to greet'
    required: true
    default: 'World'
outputs:
  time:
    description: 'The time we greeted you'
runs:
  using: 'node20'
  main: 'index.js'
```

**Generate documentation:**

```bash
# Using Docker
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml

# Using NPX
npx ci-dokumentor generate --source action.yml

# Using CLI
ci-dokumentor generate --source action.yml
```

### Generated document template

When CI Dokumentor writes or updates documentation it targets specific, clearly-marked sections inside the destination file. Use HTML comment anchors to indicate editable regions that the generator can replace. The simplest pattern is a pair of comments marking the start and end of a section:

<!-- inputs:start -->
<!-- inputs:end -->

You can create multiple named sections (for example `inputs`) to let the tool update only those parts while preserving the rest of the file. A minimal example template looks like:

```markdown
# My Action

Description of the action and any manual notes.

<!-- inputs:start -->
<!-- inputs:end -->
```

Place any hand-written documentation outside the anchored regions so it remains unchanged when the generator runs. The CLI will detect the `--destination` file and replace content inside matching anchors; if no anchors are found the generator can either append a generated section or write a new file depending on flags.

:::tip
For a full, copyable templates including all anchored sections for supported CI/CD platforms: [see the templates directory](./templates).
:::

### Using a CI/CD platform

Integrate CI Dokumentor into your CI/CD pipeline:

- ✅ [**GitHub Actions**](./integrations/github-action.md) - GitHub Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)
- 🚧 [**GitLab CI**](./integrations/gitlab-ci.md) - GitLab CI Component files (`templates/my-component.yml`) _(planned for future development)_
- 🚧 [**Dagger.io**](./integrations/dagger.md) - Dagger.io Module files (`dagger.json`) _(planned for future development)_

## CLI Usage

The CLI provides two main commands:

### Generate Command

The main command is `generate` with these key options:

- `--source <file>` - Source manifest file path to handle (required)
- `--destination <file>` - Destination file path for generated documentation (auto-detected if not specified)
- `--repository <platform>` - Repository platform (auto-detected)
- `--cicd <platform>` - CI/CD platform (auto-detected)
- `--output-format <format>` - Output format: `text`, `json`, `github-action` (Optional; default: `text`)
- `--dry-run` - Simulate generation without writing files (Optional)

### Migrate Command

The `migrate` command helps transition from other documentation tools to ci-dokumentor format:

- `--tool <tool>` - Source tool to migrate from (`action-docs`, `auto-doc`, `actdocs`, `github-action-readme-generator`)
- `--destination <file>` - File containing markers to migrate (required)
- `--dry-run` - Preview changes without writing files

```bash
# Migrate from action-docs
ci-dokumentor migrate --tool action-docs --destination README.md

# Preview migration
ci-dokumentor migrate --tool auto-doc --destination README.md --dry-run
```

:::note
The migrate command serves as a **bridge solution** to help transition from other tools when they don't perfectly fit your needs or are no longer maintained. It's not meant to compete with other excellent tools, but to provide a smooth migration path.
:::

:::tip
**📖 Full Documentation**: For more details on CLI usage, see our [**CLI documentation**](./packages/cli/).
:::

## Supported Repository Platforms

- ✅ [**Git**](./packages/repository/git/) - Basic repository information from local Git remotes
- ✅ [**GitHub**](./packages/repository/github/) - GitHub Repository information and metadata via GraphQL API
- 🚧 [**GitLab**](./packages/repository/gitlab/) - GitLab Repository information and metadata _(planned for future development)_

## Next Steps

For detailed information, explore these guides:

- 🐳 [**Docker Integration**](./integrations/docker.md) - Advanced Docker usage patterns
- 🐙 [**GitHub Actions**](./integrations/github-action.md) - GitHub Actions integration guide
- 🦊 [**GitLab CI**](./integrations/gitlab-ci.md) - GitLab CI integration guide
- 🗡️ [**Dagger.io**](./integrations/dagger.md) - Dagger.io integration guide
- 🔄 [**Migration Guide**](./integrations/migration.md) - Migrate from other documentation tools
- 💻 [**CLI Package**](./packages/cli/) - Complete command-line reference
- 📦 [**Core Architecture**](./packages/core/) - Learn about the internal architecture
- 👨‍💻 [**Developer Guide**](./developers/) - Contribute to the project
