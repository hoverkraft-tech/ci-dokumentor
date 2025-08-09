---
sidebar_position: 2
---

# GitHub Action Integration

CI Dokumentor can be used directly as a GitHub Action in your workflows, making it easy to automatically generate and maintain documentation for your CI/CD components.

## Quick Start

Add CI Dokumentor to your GitHub workflow:

```yaml
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
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs'
```

## Basic Usage

### Simple Documentation Generation

```yaml
- name: Generate Action Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

### Generate Documentation for Workflows

```yaml
- name: Generate Workflow Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: '.github/workflows/ci.yml --output docs'
```

### Multiple Files

```yaml
- name: Generate All Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml .github/workflows/*.yml --output docs'
```

## Advanced Configuration

### With Repository Information

```yaml
- name: Generate Enhanced Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --include-repo-info'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Custom Author and License

```yaml
- name: Generate Documentation with Custom Info
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --author "My Team" --license "MIT"'
```

### Verbose Output

```yaml
- name: Generate Documentation (Verbose)
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --verbose'
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
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs --include-repo-info'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Check for Documentation Changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain docs/)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi
          
      - name: Commit Documentation Updates
        if: steps.verify-changed-files.outputs.changed == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "docs: update generated documentation [skip ci]"
          git push
```

### Pull Request Documentation Check

This workflow validates that documentation is up-to-date on pull requests:

```yaml title=".github/workflows/docs-check.yml"
name: Documentation Check

on:
  pull_request:
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output temp-docs'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Check Documentation is Up-to-Date
        run: |
          if ! diff -r docs/ temp-docs/ > /dev/null; then
            echo "❌ Documentation is out of date!"
            echo "📝 Please run the following command to update:"
            echo "   docker run --rm -v \$(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest /workspace/action.yml --output /workspace/docs"
            echo ""
            echo "📋 Differences found:"
            diff -r docs/ temp-docs/ || true
            exit 1
          else
            echo "✅ Documentation is up-to-date!"
          fi
```

### Multi-Platform Documentation

Generate documentation for different platforms:

```yaml title=".github/workflows/multi-platform-docs.yml"
name: Multi-Platform Documentation

on:
  push:
    branches: [main]
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [github-actions, general]
        
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation for ${{ matrix.platform }}
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs/${{ matrix.platform }} --type ${{ matrix.platform }}'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Upload Documentation Artifact
        uses: actions/upload-artifact@v4
        with:
          name: docs-${{ matrix.platform }}
          path: docs/${{ matrix.platform }}/
          
  publish-docs:
    needs: generate-docs
    runs-on: ubuntu-latest
    steps:
      - name: Download All Documentation
        uses: actions/download-artifact@v4
        with:
          path: all-docs/
          
      - name: Combine Documentation
        run: |
          mkdir -p final-docs
          cp -r all-docs/docs-*/* final-docs/
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./final-docs
```

### Release Documentation

Generate documentation when creating releases:

```yaml title=".github/workflows/release-docs.yml"
name: Release Documentation

on:
  release:
    types: [published]

jobs:
  generate-release-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.release.tag_name }}
          
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output release-docs --include-repo-info'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Create Documentation Archive
        run: |
          cd release-docs
          tar -czf ../docs-${{ github.event.release.tag_name }}.tar.gz *
          
      - name: Upload Documentation to Release
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ github.event.release.upload_url }}
          asset_path: ./docs-${{ github.event.release.tag_name }}.tar.gz
          asset_name: documentation.tar.gz
          asset_content_type: application/gzip
```

## Input Arguments

### Available Arguments

All CLI arguments can be passed through the `args` input:

```yaml
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: |
      action.yml
      --output docs
      --type github-actions
      --author "My Team"
      --license "MIT"
      --include-repo-info
      --verbose
```

### Common Argument Patterns

```yaml
# Basic usage
args: 'action.yml'

# With output directory
args: 'action.yml --output docs'

# Multiple files
args: 'action.yml .github/workflows/ci.yml --output docs'

# With enhanced features
args: 'action.yml --output docs --include-repo-info --verbose'

# Custom metadata
args: 'action.yml --output docs --author "Team Name" --license "Apache-2.0"'
```

## Environment Variables

### GitHub Token

Provide enhanced repository information:

```yaml
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --include-repo-info'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Custom Configuration

```yaml
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CI_DOKUMENTOR_AUTHOR: "My Organization"
    CI_DOKUMENTOR_LICENSE: "MIT"
    CI_DOKUMENTOR_VERBOSE: "true"
```

## Conditional Execution

### Run Only on File Changes

```yaml
- name: Generate Documentation
  if: contains(github.event.head_commit.modified, 'action.yml') || contains(github.event.head_commit.added, 'action.yml')
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

### Run Only on Main Branch

```yaml
- name: Generate Documentation
  if: github.ref == 'refs/heads/main'
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

### Run Only for Specific File Types

```yaml
name: Generate Documentation

on:
  push:
    paths:
      - 'action.yml'
      - 'action.yaml'
      - '.github/workflows/*.yml'
      - '.github/workflows/*.yaml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs'
```

## Error Handling

### Continue on Error

```yaml
- name: Generate Documentation
  continue-on-error: true
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

### Custom Error Handling

```yaml
- name: Generate Documentation
  id: generate-docs
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
  continue-on-error: true
  
- name: Handle Documentation Failure
  if: steps.generate-docs.outcome == 'failure'
  run: |
    echo "❌ Documentation generation failed"
    echo "Please check the action.yml file for syntax errors"
    exit 1
```

### Validation Step

```yaml
- name: Validate CI/CD Files
  run: |
    # Validate YAML syntax
    for file in action.yml .github/workflows/*.yml; do
      if [ -f "$file" ]; then
        echo "Validating $file..."
        yamllint "$file" || exit 1
      fi
    done
    
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

## Performance Optimization

### Cache Docker Image

```yaml
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

Note: GitHub Actions automatically caches Docker images, so subsequent runs will be faster.

### Parallel Documentation Generation

```yaml
jobs:
  generate-docs:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        file: 
          - action.yml
          - .github/workflows/ci.yml
          - .github/workflows/deploy.yml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation for ${{ matrix.file }}
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: '${{ matrix.file }} --output docs/$(basename ${{ matrix.file }} .yml)'
```

## Security Considerations

### Minimal Permissions

```yaml
permissions:
  contents: read  # Only read access needed for basic generation
  
jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs'
```

### Write Permissions for Auto-Commit

```yaml
permissions:
  contents: write  # Write access for committing documentation
  
jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
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

### Secure Token Usage

```yaml
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --include-repo-info'
  env:
    # Use built-in GITHUB_TOKEN (automatically provided)
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    # Or use a custom PAT for enhanced permissions
    # GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

## Troubleshooting

### Common Issues

#### Action Not Found

**Problem**: `Error: Unable to resolve action`

**Solution**: Ensure you're using the full Docker image path:
```yaml
# ✅ Correct
uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest

# ❌ Incorrect
uses: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
```

#### Permission Denied

**Problem**: `Permission denied` when writing files

**Solution**: Ensure proper permissions are set:
```yaml
permissions:
  contents: write

# Or for read-only operations:
permissions:
  contents: read
```

#### File Not Found

**Problem**: `File not found: action.yml`

**Solution**: Check file paths and ensure checkout:
```yaml
- name: Checkout
  uses: actions/checkout@v4  # Required to access repository files
  
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'  # Ensure correct file path
```

### Debugging

#### Enable Verbose Output

```yaml
- name: Generate Documentation (Debug)
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --verbose'
```

#### Check File Contents

```yaml
- name: Debug - List Files
  run: |
    echo "Repository contents:"
    find . -name "*.yml" -o -name "*.yaml" | head -20
    
    echo "action.yml contents:"
    cat action.yml || echo "action.yml not found"
    
- name: Generate Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs --verbose'
```

## Related Documentation

- [Docker Integration](./docker) - Using CI Dokumentor with Docker
- [CLI Package](../packages/cli) - Command-line interface reference
- [Getting Started](../getting-started/quick-start) - Basic usage examples
- [Developers Guide](../developers/ci-cd) - Advanced CI/CD integration patterns