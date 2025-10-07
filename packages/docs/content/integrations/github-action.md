---
title: GitHub Action Integration
description: Use CI Dokumentor as a GitHub Action in your workflows for automated documentation generation
sidebar_position: 2
---

CI Dokumentor can be used directly as a GitHub Action in your workflows, making it easy to automatically generate and maintain documentation for your CI/CD components.

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    # Source manifest file path(s) to handle. Supports:
    # - Single file: `action.yml`
    # - Multiple files (space-separated): `action.yml .github/workflows/ci.yml`
    # - Multiple files (newline-separated): Use multiline YAML string
    # - Glob patterns: `*.yml` or `.github/workflows/*.yml`
    #
    # This input is required.
    source: ""

    # Destination path for generated documentation (optional; destination is auto-detected if not specified by the adapter).
    # Only applicable when processing a single file.
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

    # Maximum number of files to process concurrently when processing multiple files.
    # Default: `5`
    concurrency: "5"

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
| **`source`**                | Source manifest file path(s) to handle. Supports:                                                                                                            | **true**     | -                     |
|                             | - Single file: `action.yml`                                                                                                                                  |              |                       |
|                             | - Multiple files (space-separated): `action.yml .github/workflows/ci.yml`                                                                                    |              |                       |
|                             | - Multiple files (newline-separated): Use multiline YAML string                                                                                              |              |                       |
|                             | - Glob patterns: `*.yml` or `.github/workflows/*.yml`                                                                                                        |              |                       |
| **`destination`**           | Destination path for generated documentation (optional; destination is auto-detected if not specified by the adapter).                                       | **false**    | -                     |
|                             | Only applicable when processing a single file.                                                                                                               |              |                       |
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
| **`concurrency`**           | Maximum number of files to process concurrently when processing multiple files.                                                                              | **false**    | `5`                   |
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
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    source: ".github/workflows/ci.yml"
```

### Advanced Usage with All Options

```yaml
- name: Generate Enhanced Documentation
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
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

The GitHub Action now natively supports multiple files and glob patterns through the `source` input:

**Using Glob Pattern:**

```yaml
- name: Generate Documentation for All YAML Files
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    source: "*.yml"
    concurrency: 10
```

**Using Multiple Files (Space-Separated):**

```yaml
- name: Generate Documentation for Multiple Files
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    source: "action.yml .github/workflows/ci.yml .github/workflows/cd.yml"
```

**Using Multiple Files (Multiline):**

```yaml
- name: Generate Documentation for Multiple Files
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    source: |
      action.yml
      .github/workflows/ci.yml
      .github/workflows/cd.yml
```

**Alternative: Using Matrix Strategy for Parallel Execution:**

For more control over parallel execution, you can still use GitHub Actions matrix:

```yaml
- name: Generate Documentation
  strategy:
    matrix:
      file:
        - action.yml
        - .github/workflows/ci.yml
        - .github/workflows/cd.yml
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
  with:
    source: ${{ matrix.file }}
```

### Dry-run Example

To preview changes without modifying files, set the `dry-run` input to `true`. The action will pass `--dry-run` to the CLI and the core generator will produce a diff instead of writing files.

```yaml
- name: Generate Documentation (dry-run)
  uses: hoverkraft-tech/ci-dokumentor@c46a1a108957237cf485103a80b060c35c7dba33 # 0.2.2
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
