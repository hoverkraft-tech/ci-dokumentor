# CI Dokumentor

<p align="center">
  <a href="https://github.com/hoverkraft-tech/ci-dokumentor" target="_blank"><img src="https://repository-images.githubusercontent.com/967387766/275872f7-f4bc-40f8-b3d2-4a39496728bc" width="600" alt="CI Dokumentor - Automated documentation generator for CI/CD components" /></a>
</p>

<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-ci--dokumentor-blue?logo=github-actions)](https://github.com/marketplace/actions/ci-dokumentor)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-dokumentor)](https://github.com/hoverkraft-tech/ci-dokumentor/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-dokumentor)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-dokumentor?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-dokumentor?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)
[![Total Downloads](https://img.shields.io/npm/dm/@ci-dokumentor/cli)](https://www.npmjs.com/package/@ci-dokumentor/cli)
[![Coverage Status](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg)](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor)
[![Continuous Integration](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml/badge.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml)

<!-- badges:end -->

📢 **CI Dokumentor** is an automated documentation generator for CI/CD components

## 📖 Documentation

**Complete documentation is available at: [hoverkraft-tech.github.io/ci-dokumentor](https://hoverkraft-tech.github.io/ci-dokumentor)**

### Quick Links

- 🚀 [Getting Started](./packages/docs/content/intro.md) - Installation and quick start
- 🐳 [Docker](./packages/docs/content/integrations/docker.md) - Docker integration guide
- 🔧 [GitHub Action](./packages/docs/content/integrations/github-action.md) - GitHub Actions integration
- 👨‍💻 [Contributing](./packages/docs/content/developers/contributing.md) - How to contribute

<!-- examples:start -->

## Examples

Integration examples for various usages and CI/CD platforms.

### Npm package

```bash
# Install globally
npm install -g @ci-dokumentor/cli

# Use the CLI
ci-dokumentor generate --source action.yml

# Or use directly with npx
npx @ci-dokumentor/cli generate --source action.yml
```

### Docker

CI Dokumentor is available as a Docker image that provides a lightweight, containerized way to generate documentation for your CI/CD components.

```bash
# Show available options
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest --help

# Generate documentation from CI/CD file
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest generate --source /workspace/action.yml
```

> **📖 Full Documentation**: See our [Docker documentation](./packages/docs/content/integrations/docker.md) for complete Docker usage guide, troubleshooting, and advanced configurations.

### GitHub Actions

```yaml
- name: Generate CI Documentation
  uses: hoverkraft-tech/ci-dokumentor@301ef70a95e03b39e07ee0d3dc2da21de82e51ce # 0.4.0
  with:
    source: "action.yml"
```

<!-- examples:end -->

> **📖 Full Documentation**: For more details on GitHub Actions integration, see our [GitHub Action documentation](./packages/docs/content/integrations/github-action.md).

### GitLab CI

```yaml
generate-docs:
  stage: docs
  image: ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
  script:
    - ci-dokumentor generate --source templates/my-component/template.yml
  artifacts:
    paths:
      - templates/my-component/docs.md
```

> **📖 Full Documentation**: For more details on GitLab CI integration, see our [GitLab CI documentation](./packages/docs/content/integrations/gitlab-ci.md).

### Dagger.io

```go
func (m *MyModule) GenerateDocs(ctx context.Context, source *dagger.Directory) *dagger.Directory {
    return dag.Container().
  From("ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest").
        WithMountedDirectory("/workspace", source).
        WithWorkdir("/workspace").
        WithExec([]string{"ci-dokumentor", "generate", "--source", "action.yml"}).
        Directory("docs")
}
```

> **📖 Full Documentation**: For more details on Dagger.io integration, see our [Dagger.io documentation](./packages/docs/content/integrations/dagger.md).

<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->

<!-- security:start -->
<!-- security:end -->

## Author

👤 **[Hoverkraft](https://hoverkraft.cloud)**

- Site: <https://hoverkraft.cloud>
- GitHub: [@hoverkraft-tech](https://github.com/hoverkraft-tech)

<!-- license:start -->

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2026 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
