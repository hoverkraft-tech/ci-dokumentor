# GitHub Actions Adapter Documentation Generator

A comprehensive documentation generator for GitHub Actions and Workflows that creates beautiful, standardized documentation automatically.

## Features

### 🎯 Smart Section Generation

- **Header**: Centered title with project branding
- **Badges**: Build status, version, license, and marketplace badges
- **Overview**: Project description and value proposition
- **Table of Contents**: Auto-generated navigation
- **Usage**: Quick-start examples and copy-paste snippets
- **Inputs**: Detailed parameter documentation with types and defaults
- **Outputs**: Result documentation with descriptions
- **Environment & Secrets**: Security configuration documentation
- **Examples**: Real-world usage examples with multiple scenarios
- **Jobs**: Workflow job breakdown and dependencies (for workflows)
- **Contributing**: Development workflow and contribution guidelines
- **Security**: Vulnerability reporting and security best practices
- **License**: Legal information and attribution

### 🔧 Enhanced Types Support

Complete TypeScript definitions for GitHub Actions and Workflows including:

- Action inputs/outputs with types and validation
- Workflow job definitions and dependencies
- Environment variables and secrets
- Matrix strategies and conditions
- Permissions and security settings

### 📝 Rich Formatting

Enhanced markdown formatter with support for:

- Multi-level headings
- Tables with proper alignment
- Code blocks with syntax highlighting
- Inline code formatting
- Lists (ordered and unordered)
- Links and badges
- Horizontal rules and line breaks
- Bold and italic text
- Centered content

## Section Generators

### Core Sections

- `HeaderSectionGenerator` - Project title and branding
- `BadgesSectionGenerator` - Status and information badges
- `OverviewSectionGenerator` - Project description
- `ContentsSectionGenerator` - Table of contents navigation

### Action-Specific Sections

- `UsageSectionGenerator` - Usage examples
- `InputsSectionGenerator` - Parameter documentation
- `OutputsSectionGenerator` - Return value documentation
- `ExamplesSectionGenerator` - Advanced usage scenarios

### Workflow-Specific Sections

- `JobsSectionGenerator` - Job breakdown and dependencies
- `SecretsSectionGenerator` - Environment and security configuration

### Common Sections

- `ContributingSectionGenerator` - Development guidelines
- `SecuritySectionGenerator` - Security policies and best practices
- `LicenseSectionGenerator` - Legal information

## Building

Run `nx build github-actions` to build the library.

## Running unit tests

Run `nx test github-actions` to execute the unit tests via [Vitest](https://vitest.dev/).
