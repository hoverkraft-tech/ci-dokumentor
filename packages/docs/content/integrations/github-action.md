---
title: GitHub Action Integration
description: Use CI Dokumentor as a GitHub Action in your workflows for automated documentation generation
sidebar_position: 2
---

CI Dokumentor can be used directly as a GitHub Action in your workflows, making it easy to automatically generate and maintain documentation for your CI/CD components.

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-dokumentor@ed9fddccd2f5f5596ad929f2fa2a931fcdd5a282 # 0.1.3
  with:
    # Source manifest file path to handle (e.g. `action.yml`, `.github/workflows/ci.yml`).
    # This input is required.
    source: ""

    # Destination path for generated documentation (optional; destination is auto-detected if not specified by the adapter).
    destination: ""

    # Repository platform (auto-detected if not specified).
    repository: ""

    # CI/CD platform (`github-actions`, `gitlab-ci`, etc.).
    cicd: ""

    # Comma-separated list of sections to include.
    include-sections: ""

    # Comma-separated list of sections to exclude.
    exclude-sections: ""

    # Whether to perform a dry run (no files are written).
    # Default: `false`
    dry-run: "false"

    # Version to document (auto-detected if not specified).
    version: ""

    # JSON array of extra badges to include in the documentation.
    # Each badge should have `label`, `url`, and optional `linkUrl` properties.
    extra-badges: ""

    # Transform bare URLs to links.
    # Types: `auto` (autolinks), `full` (full links), `false` (disabled).
    #
    # Default: `auto`
    format-link: auto

    # The GitHub token used to fetch repository information.
    # Default: `${{ github.token }}`
    github-token: ${{ github.token }}

    # Version of CI Dokumentor to use. See https://github.com/hoverkraft-tech/ci-dokumentor/releases.
    # Default: `latest`
    ci-dokumentor-version: latest
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

| **Input**                   | **Description**                                                                                                                                              | **Required** | **Default**           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------- |
| **`source`**                | Source manifest file path to handle (e.g. `action.yml`, `.github/workflows/ci.yml`).                                                                         | **true**     | -                     |
| **`destination`**           | Destination path for generated documentation (optional; destination is auto-detected if not specified by the adapter).                                       | **false**    | -                     |
| **`repository`**            | Repository platform (auto-detected if not specified).                                                                                                        | **false**    | -                     |
| **`cicd`**                  | CI/CD platform (`github-actions`, `gitlab-ci`, etc.).                                                                                                        | **false**    | -                     |
| **`include-sections`**      | Comma-separated list of sections to include.                                                                                                                 | **false**    | -                     |
| **`exclude-sections`**      | Comma-separated list of sections to exclude.                                                                                                                 | **false**    | -                     |
| **`dry-run`**               | Whether to perform a dry run (no files are written).                                                                                                         | **false**    | `false`               |
| **`version`**               | Version to document (auto-detected if not specified).                                                                                                        | **false**    | -                     |
| **`extra-badges`**          | JSON array of extra badges to include in the documentation.                                                                                                  | **false**    | -                     |
|                             | Each badge should have `label`, `url`, and optional `linkUrl` properties.                                                                                    |              |                       |
| **`format-link`**           | Transform bare URLs to links.                                                                                                                                | **false**    | `auto`                |
|                             | Types: `auto` (autolinks), `full` (full links), `false` (disabled).                                                                                          |              |                       |
| **`github-token`**          | The GitHub token used to fetch repository information.                                                                                                       | **false**    | `${{ github.token }}` |
| **`ci-dokumentor-version`** | Version of CI Dokumentor to use. See [https://github.com/hoverkraft-tech/ci-dokumentor/releases](https://github.com/hoverkraft-tech/ci-dokumentor/releases). | **false**    | `latest`              |

<!-- inputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                               |
| ----------------- | --------------------------------------------- |
| **`destination`** | Destination path for generated documentation. |

<!-- outputs:end -->

<!-- examples:start -->

## Examples

### Generate Documentation for Workflows

```yaml
- name: Generate Workflow Documentation
  uses: hoverkraft-tech/ci-dokumentor@ed9fddccd2f5f5596ad929f2fa2a931fcdd5a282 # 0.1.3
  with:
    source: ".github/workflows/ci.yml"
```

### Advanced Usage with All Options

```yaml
- name: Generate Enhanced Documentation
  uses: hoverkraft-tech/ci-dokumentor@ed9fddccd2f5f5596ad929f2fa2a931fcdd5a282 # 0.1.3
  with:
    source: "action.yml"
    destination: "docs/README.md"
    repository: "github"
    cicd: "github-actions"
    include-sections: "inputs,outputs,runs"
    exclude-sections: "examples"
    format-link: "full"
```

### Multiple Files Processing

While the GitHub Action itself accepts a single `source` input, you can use matrix strategies or multiple steps to process multiple files:

**Using Matrix Strategy:**

```yaml
- name: Generate Documentation
  strategy:
    matrix:
      file:
        - action.yml
        - .github/workflows/ci.yml
        - .github/workflows/cd.yml
  uses: hoverkraft-tech/ci-dokumentor@ed9fddccd2f5f5596ad929f2fa2a931fcdd5a282 # 0.1.3
  with:
    source: ${{ matrix.file }}
```

**Using Docker/CLI Directly with Glob Patterns:**

For more advanced use cases, you can use the Docker image or CLI directly with glob patterns:

```yaml
- name: Generate Documentation for Multiple Files
  run: |
    docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
      ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
      generate --source "/workspace/*.yml" --concurrency 10
```

**Using Script Step:**

```yaml
- name: Generate Documentation for All YAML Files
  run: |
    npx ci-dokumentor generate --source "*.yml" --concurrency 5
```

### Dry-run Example

To preview changes without modifying files, set the `dry-run` input to `true`. The action will pass `--dry-run` to the CLI and the core generator will produce a diff instead of writing files.

```yaml
- name: Generate Documentation (dry-run)
  uses: hoverkraft-tech/ci-dokumentor@ed9fddccd2f5f5596ad929f2fa2a931fcdd5a282 # 0.1.3
  with:
    source: "action.yml"
    dry-run: "true"
```

<!-- examples:end -->

## Related Documentation

- [CLI Package](../packages/cli/) - Command-line interface reference
- [CI/CD - GitHub Package](../packages/cicd/github-actions/) - CI/CD GitHub package reference
- [Introduction](../intro.md) - Quick start and basic usage examples
- [Developers Guide](../developers/ci-cd.md) - Advanced CI/CD integration patterns
