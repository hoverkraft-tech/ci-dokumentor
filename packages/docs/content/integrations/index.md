---
title: Integrations
description: Integration guides and adapters index for all supported platforms and tools
sidebar_position: 2
---

Guides and documentation for integrations supported by the project.

## Available Integrations

### CI/CD Platform Integrations

- [🐙 **GitHub Actions**](./github-action.md) — Use CI Dokumentor as a GitHub Action for automated documentation generation in your workflows
- [🦊 **GitLab CI**](./gitlab-ci.md) — GitLab CI integration for components and pipelines _(planned for future development)_
- [🗡️ **Dagger.io**](./dagger.md) — Integration with Dagger modules and pipelines _(planned for future development)_

### Installation and Usage Methods

- [🐳 **Docker**](./docker.md) — Use the Docker image for containerized environments and maximum portability
- [📦 **Node.js Package**](./nodejs-package.md) — Install and use as an npm package in your Node.js projects

### Migration and Compatibility

- [🔄 **Migration Guide**](./migration.md) — Migrate from other documentation tools like action-docs, auto-doc, and more

## Getting Started

1. **Choose your integration method** based on your workflow:
   - **GitHub workflows** → [GitHub Actions integration](./github-action.md)
   - **Docker/containers** → [Docker integration](./docker.md)
   - **Node.js projects** → [Node.js package](./nodejs-package.md)
   - **Existing tools** → [Migration guide](./migration.md)

2. **Follow the specific setup guide** for your chosen integration

3. **Configure your first documentation generation** using the examples provided

## Quick Reference

| Integration                            | Best For                          | Status       |
| -------------------------------------- | --------------------------------- | ------------ |
| [GitHub Actions](./github-action.md)   | GitHub workflows and repositories | ✅ Available |
| [Docker](./docker.md)                  | Cross-platform, CI/CD pipelines   | ✅ Available |
| [Node.js Package](./nodejs-package.md) | Local development, npm scripts    | ✅ Available |
| [Migration Tool](./migration.md)       | Transitioning from other tools    | ✅ Available |
| [GitLab CI](./gitlab-ci.md)            | GitLab repositories and pipelines | 🚧 Planned   |
| [Dagger.io](./dagger.md)               | Dagger modules and pipelines      | 🚧 Planned   |

## Need Help?

- 📖 See our [CLI documentation](../packages/cli/) for complete command reference
- 🏗️ Check the [templates](../templates/) for ready-to-use documentation templates
- 🛠️ Review [developer documentation](../developers/) if you're contributing or extending CI Dokumentor
- 🐛 [Open an issue](https://github.com/hoverkraft-tech/ci-dokumentor/issues) if you encounter problems
