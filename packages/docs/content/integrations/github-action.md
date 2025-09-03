---
sidebar_position: 2
---

# GitHub Action Integration

CI Dokumentor can be used directly as a GitHub Action in your workflows, making it easy to automatically generate and maintain documentation for your CI/CD components.

## Quick Start

CI Dokumentor can be used in two ways in GitHub Actions:

### Option 1: Use the GitHub Action (Recommended)

```yaml
name: Generate Documentation

on:
  push:
    paths:
      - 'action.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate Documentation
        uses: hoverkraft-tech/ci-dokumentor@main
        with:
          source: 'action.yml'
```

## Basic Usage

### Simple Documentation Generation

Using the GitHub Action:

```yaml
- name: Generate Action Documentation
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    source: 'action.yml'
```

### Generate Documentation for Workflows

```yaml
- name: Generate Workflow Documentation
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    source: '.github/workflows/ci.yml'
```

### Advanced Usage with All Options

The CLI accepts a single `--source <file>` per invocation. To generate documentation for multiple files in a workflow, run the action multiple times or script the Docker/CLI call for each file. Example using a shell step to process multiple manifest files:

```yaml
- name: Generate Enhanced Documentation
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    source: 'action.yml'
    output: 'docs/README.md'
    repository: 'github'
    cicd: 'github-actions'
    include-sections: 'inputs,outputs,runs'
    exclude-sections: 'examples'
```

## Complete Workflow Examples

### Auto-Commit Documentation

This workflow automatically generates and commits documentation when CI/CD files change:

```yaml title=".github/workflows/auto-docs.yml"
name: Auto-Generate Documentation

on:
  push:
    branches: [main]
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

permissions:
  contents: write

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Documentation
        uses: hoverkraft-tech/ci-dokumentor@main
        with:
          source: 'action.yml'

      - name: Check for Documentation Changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain README.md)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

      - name: Commit Documentation Updates
        if: steps.verify-changed-files.outputs.changed == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add README.md
          git commit -m "docs: update action documentation\n[skip ci]"
          git push
```

## Input Parameters

The GitHub Action supports the following input parameters that map directly to the CLI generate command options:

### Required Parameters

None - all parameters have sensible defaults.

### Optional Parameters

| Parameter          | Description                                  | Default       | Example                                 |
| ------------------ | -------------------------------------------- | ------------- | --------------------------------------- |
| `source`           | Source directory containing CI/CD files      | `.`           | `action.yml`, `.github/workflows/`, `.` |
| `output`           | Output directory for generated documentation | `./docs`      | `docs`, `documentation`, `./output`     |
| `repository`       | Repository platform                          | Auto-detected | `github`, `gitlab`                      |
| `cicd`             | CI/CD platform                               | Auto-detected | `github-actions`, `gitlab-ci`           |
| `include-sections` | Comma-separated list of sections to include  | All sections  | `inputs,outputs,runs`                   |
| `exclude-sections` | Comma-separated list of sections to exclude  | None          | `examples,troubleshooting`              |

| `dry-run` | Run in preview mode; generate a diff instead of writing files (maps to CLI `--dry-run`) | `false` | `true` |

## Related Documentation

### Dry-run Example

To preview changes without modifying files, set the `dry-run` input to `true`. The action will pass `--dry-run` to the CLI and the core generator will produce a diff instead of writing files.

```yaml
- name: Generate Documentation (dry-run)
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    source: 'action.yml'
    dry-run: 'true'
```

- [Docker Integration](./docker) - Using CI Dokumentor with Docker
- [CLI Package](../packages/cli) - Command-line interface reference
- [Introduction](../intro) - Quick start and basic usage examples
- [Developers Guide](../developers/ci-cd) - Advanced CI/CD integration patterns
