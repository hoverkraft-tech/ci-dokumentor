---
sidebar_position: 2
---

# Quick Start

Get up and running with CI Dokumentor in minutes! This guide will walk you through generating your first documentation.

## Prerequisites

Before starting, make sure you have:
- CI Dokumentor installed ([Installation Guide](./installation))
- A CI/CD configuration file (GitHub Action or workflow)

## Your First Documentation

### Step 1: Prepare Your CI/CD File

For this example, let's create a simple GitHub Action file:

```yaml title="action.yml"
name: 'Hello World Action'
description: 'A simple action that greets the world'
author: 'Your Name'

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

branding:
  icon: 'activity'
  color: 'blue'
```

### Step 2: Generate Documentation

Choose your preferred method:

#### Using Docker (Recommended)

```bash
# Generate documentation
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs

# View the generated files
ls docs/
```

#### Using NPX

```bash
# Generate documentation
npx ci-dokumentor action.yml --output docs

# View the generated files
ls docs/
```

#### Using CLI (if installed globally)

```bash
# Generate documentation
ci-dokumentor action.yml --output docs

# View the generated files
ls docs/
```

### Step 3: Review Generated Documentation

CI Dokumentor will create a `README.md` file in your output directory with:

- **Action overview** with name, description, and author
- **Inputs section** with detailed parameter descriptions
- **Outputs section** with return value descriptions  
- **Usage examples** with proper YAML syntax
- **Security considerations** and best practices
- **License information** (if available)

Example generated content:

````markdown
# Hello World Action

A simple action that greets the world

**Author:** Your Name

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `who-to-greet` | Who to greet | Yes | `World` |

## Outputs

| Name | Description |
|------|-------------|
| `time` | The time we greeted you |

## Usage

```yaml
- name: Hello World
  uses: your-username/hello-world-action@v1
  with:
    who-to-greet: 'GitHub Users'
```

## Security Considerations

- Always validate inputs to prevent injection attacks
- Use `inputs` instead of environment variables for sensitive data
````

## Common Use Cases

### GitHub Action Documentation

Generate documentation for a GitHub Action:

```bash
# Document an action.yml file
ci-dokumentor action.yml --output docs

# The output will include usage examples, inputs, outputs, and more
```

### GitHub Workflow Documentation

Generate documentation for a GitHub workflow:

```bash
# Document a workflow file
ci-dokumentor .github/workflows/ci.yml --output docs

# The output will include job descriptions, triggers, and flow diagrams
```

### Multiple Files

Generate documentation for multiple CI/CD files:

```bash
# Document all workflow files
ci-dokumentor .github/workflows/*.yml --output docs

# Document both action and workflows
ci-dokumentor action.yml .github/workflows/*.yml --output docs
```

## Configuration Options

### Output Formats

Currently, CI Dokumentor generates Markdown format, which is perfect for:
- GitHub README files
- Documentation websites (like this one!)
- Wiki pages
- Code reviews

### Customization

You can customize the generated documentation:

```bash
# Specify custom output filename
ci-dokumentor action.yml --output docs/my-action.md

# Include additional repository information
ci-dokumentor action.yml --include-repo-info

# Set custom template variables
ci-dokumentor action.yml --author "My Team" --license "MIT"
```

## Integration Examples

### In GitHub Actions Workflow

Automatically generate documentation when CI/CD files change:

```yaml title=".github/workflows/docs.yml"
name: Generate Documentation

on:
  push:
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs'
      
      - name: Commit Documentation
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git diff --staged --quiet || git commit -m "docs: update generated documentation"
          git push
```

### In Package.json Scripts

Add documentation generation to your npm scripts:

```json title="package.json"
{
  "scripts": {
    "docs:generate": "ci-dokumentor action.yml --output docs",
    "docs:build": "npm run docs:generate && docusaurus build",
    "docs:serve": "npm run docs:generate && docusaurus serve"
  }
}
```

### In Makefile

Add to your project's Makefile:

```makefile title="Makefile"
.PHONY: docs
docs:
	docker run --rm -v $(PWD):/workspace \
		ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
		/workspace/action.yml --output /workspace/docs

docs-serve: docs
	cd docs && python -m http.server 8000
```

## Troubleshooting

### Common Issues

**File not found:**
```bash
# Make sure the file path is correct
ls -la action.yml

# Use absolute paths if needed
ci-dokumentor /full/path/to/action.yml
```

**Permission denied (Docker):**
```bash
# Fix output directory permissions
chmod 755 ./docs

# Or run with user mapping
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest action.yml
```

**Invalid YAML:**
```bash
# Validate your YAML syntax
yamllint action.yml

# Or use online validator
# https://yaml-online-parser.appspot.com/
```

## Next Steps

Now that you've generated your first documentation, explore more advanced features:

- 📦 [Package Documentation](../packages/core) - Learn about individual components
- 🐳 [Docker Integration](../integrations/docker) - Advanced Docker usage patterns
- 🔧 [CLI Reference](../packages/cli) - Complete command-line options
- 👨‍💻 [Contributing](../developers/contributing) - Help improve CI Dokumentor

## Examples Repository

Check out our examples repository for more real-world use cases:
- [CI Dokumentor Examples](https://github.com/hoverkraft-tech/ci-dokumentor-examples)

Happy documenting! 🚀