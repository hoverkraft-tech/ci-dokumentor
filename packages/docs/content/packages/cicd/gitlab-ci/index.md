---
title: CI/CD - GitLab CI Package
description: GitLab-specific CI/CD manifest parsing and documentation generation capabilities.
sidebar_position: 5
---

The `@ci-dokumentor/cicd-gitlab-ci` package provides GitLab-specific CI/CD manifest parsing and documentation generation capabilities.

## Features

- **GitLab CI Pipeline Documentation** - Generate docs for `.gitlab-ci.yml` files
- **GitLab Component Support** - Full support for GitLab CI components and templates
- **Input Documentation** - Automatic parameter tables for components
- **Usage Examples** - Generated inclusion examples
- **Multi-Format Support** - Handles both pipeline and component manifests

## Installation

```bash
npm install @ci-dokumentor/cicd-gitlab-ci
```

## Supported Files

### Supported GitLab CI Pipelines

- `.gitlab-ci.yml` - Main GitLab CI configuration files
- `.gitlab-ci.yaml` - Alternative extension

### Supported GitLab Components

- `templates/*/template.yml` - GitLab component templates
- `templates/*/template.yaml` - Alternative extension

## Usage

The GitLab CI generator is automatically registered when the package is imported:

```typescript
import "@ci-dokumentor/cicd-gitlab-ci";
```

## GitLab Components

GitLab components are reusable CI/CD configurations. Place your component template in a `templates/` directory:

```yaml
# templates/build-component/template.yml

# Build component for Node.js applications
# Provides standardized build process with configurable options

spec:
  inputs:
    node_version:
      description: "Node.js version to use"
      type: string
      default: "18"
    build_command:
      description: "Build command to execute"
      type: string
      default: "npm run build"
    test_enabled:
      description: "Whether to run tests"
      type: boolean
      default: true

build:
  image: node:$[[ inputs.node_version ]]
  script:
    - npm ci
    - if [ "$[[ inputs.test_enabled ]]" = "true" ]; then npm test; fi
    - $[[ inputs.build_command ]]
  artifacts:
    paths:
      - dist/
```

Documentation will be generated at `templates/build-component/docs.md`.

## GitLab CI Pipelines

For regular GitLab CI pipelines, documentation is generated based on the pipeline structure:

```yaml
# .gitlab-ci.yml

# Main CI/CD pipeline for the project
# Includes build, test, and deployment stages

stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm test
  coverage: '/Coverage: \d+\.\d+%/'

deploy:
  stage: deploy
  script:
    - echo "Deploying application..."
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Generated Sections

The following documentation sections are automatically generated:

- **Header** - Component/pipeline name and project logo
- **Overview** - Description extracted from YAML comments
- **Usage** - Include examples for components and pipelines
- **Inputs** - Parameter table for components (name, description, type, default, required)

## Component Usage Examples

Generated usage examples show how to include components in GitLab CI:

```yaml
include:
  - component: gitlab.com/my-org/my-project/templates/build-component/template.yml@latest
    with:
      node_version: "20"
      build_command: "npm run build:prod"
      test_enabled: false
```

## Pipeline Usage Examples

For reusable pipelines:

```yaml
include:
  - project: "my-org/my-project"
    file: ".gitlab-ci.yml"
    ref: "v1.0.0"
```

## Best Practices

1. **Component Documentation** - Add descriptive comments at the top of component templates
2. **Input Specifications** - Always define input types, defaults, and descriptions
3. **Version Tagging** - Use semantic versioning for component releases
4. **Examples** - Include usage examples in your component documentation
