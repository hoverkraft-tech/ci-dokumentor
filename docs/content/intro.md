---
sidebar_position: 1
---

# Introduction

Welcome to **CI Dokumentor** - an automated documentation generator for CI/CD components.

## What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that automatically generates comprehensive, professional documentation for your CI/CD workflows, actions, and configurations.

### Key Features

- 📖 **Automated Generation** - Convert CI/CD configuration files into professional documentation
- 🔧 **Extensible Design** - Easy to add support for new CI/CD platforms
- 🐳 **Docker Ready** - Available as a Docker image for easy integration
- 🚀 **GitHub Action** - Can be used directly in GitHub workflows
- 📋 **CLI Tool** - Command-line interface for local usage

## Supported Platforms

### CI/CD Platforms
- ✅ **GitHub Actions** - Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)
- 🔄 **More platforms coming** - GitLab CI, Jenkins, Azure Pipelines planned

### Repository Platforms  
- ✅ **GitHub** - Repository information and metadata
- ✅ **Git** - Basic repository information
- 🔄 **More platforms coming** - GitLab, Bitbucket planned

## Architecture Overview

CI Dokumentor is built with a clean, modular architecture:

- **Core Package** - Base abstractions and services
- **Repository Packages** - Handle repository-specific functionality (GitHub, Git)
- **CI/CD Packages** - Handle CI/CD platform parsing and generation (GitHub Actions)
- **CLI Package** - Command-line interface application

This separation allows for easy extensibility and testing of individual components.

## Next Steps

- 📚 [Installation Guide](./getting-started/installation) - Set up CI Dokumentor
- 🚀 [Quick Start Guide](./getting-started/quick-start) - Generate your first documentation
- 📦 [Package Documentation](./packages/core) - Learn about individual packages
- 🐳 [Docker Integration](./integrations/docker) - Use CI Dokumentor with Docker
- 👨‍💻 [Developer Guide](./developers/contributing) - Contribute to the project
