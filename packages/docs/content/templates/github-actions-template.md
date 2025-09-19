---
title: GitHub Actions Documentation Template
description: Complete template for GitHub Actions documentation with all available sections
sidebar_position: 2
---

This template provides all available documentation sections for GitHub Actions. Copy and paste the sections you need into your README.md or documentation file.

## Complete Template

```markdown
<!-- header:start -->
<!-- header:end -->
<!-- badges:start -->
<!-- badges:end -->
<!-- overview:start -->
<!-- overview:end -->
<!-- usage:start -->
<!-- usage:end -->
<!-- inputs:start -->
<!-- inputs:end -->
<!-- outputs:start -->
<!-- outputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- contributing:start -->
<!-- contributing:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->
<!-- license:end -->
<!-- generated:start -->
<!-- generated:end -->
```

## Available Sections

| Section        | Description                                           |
| -------------- | ----------------------------------------------------- |
| `header`       | Action name and branding                              |
| `badges`       | Status badges and marketplace links                   |
| `overview`     | Description and key features                          |
| `usage`        | Basic usage examples                                  |
| `inputs`       | Input parameter documentation                         |
| `outputs`      | Output parameter documentation                        |
| `secrets`      | Required secrets documentation (For GitHub Workflows) |
| `contributing` | Contributing guidelines                               |
| `security`     | Security guidelines                                   |
| `license`      | License information                                   |
| `generated`    | CI Dokumentor attribution                             |

## Usage Tips

- **Keep manual content outside markers**: Place your custom documentation outside the `<!-- section:start -->` and `<!-- section:end -->` markers
- **Selective sections**: Only include the sections you need - remove unused ones
- **Order matters**: Arrange sections in a logical order for your users
- **Version references**: Use pinned version tags
