---
title: GitHub Action Integration
description: Use CI Dokumentor as a GitHub Action in your workflows for automated documentation generation
sidebar_position: 2
---

CI Dokumentor can be used directly as a GitHub Action in your workflows, making it easy to automatically generate and maintain documentation for your CI/CD components.

<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-dokumentor@e8245ca85cf69b517504f88d4201a742c471015f # main
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
  uses: hoverkraft-tech/ci-dokumentor@489afd19cadc03b3c8610baaaf8899667d153038 # main
  with:
    source: ".github/workflows/ci.yml"
```

### Advanced Usage with All Options

The CLI accepts a single `--source <file>` per invocation. To generate documentation for multiple files in a workflow, run the action multiple times or script the Docker/CLI call for each file. Example using a shell step to process multiple manifest files:

```yaml
- name: Generate Enhanced Documentation
  uses: hoverkraft-tech/ci-dokumentor@489afd19cadc03b3c8610baaaf8899667d153038 # main
  with:
    source: "action.yml"
    output: "docs/README.md"
    repository: "github"
    cicd: "github-actions"
    include-sections: "inputs,outputs,runs"
    exclude-sections: "examples"
    format-link: "full"
```

### Dry-run Example

To preview changes without modifying files, set the `dry-run` input to `true`. The action will pass `--dry-run` to the CLI and the core generator will produce a diff instead of writing files.

```yaml
- name: Generate Documentation (dry-run)
  uses: hoverkraft-tech/ci-dokumentor@489afd19cadc03b3c8610baaaf8899667d153038 # main
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
