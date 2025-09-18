---
title: Node.js Package Integration
description: Install and use CI Dokumentor as an npm package in your Node.js projects
sidebar_position: 6
---

# Node.js Package

## Using the published package: `@ci-dokumentor/cli`

The CLI is published as a scoped npm package `@ci-dokumentor/cli`. The package includes all necessary dependencies bundled together, making it a standalone tool that works independently of the monorepo structure.

### Package Information

- **Package Name**: `@ci-dokumentor/cli`
- **Binary Name**: `ci-dokumentor`
- **Registry**: [npm registry](https://www.npmjs.com/package/@ci-dokumentor/cli)
- **Standalone**: Includes all workspace dependencies bundled

### One-off usage with npx

```bash
npx @ci-dokumentor/cli --help
npx @ci-dokumentor/cli generate --source action.yml
```

### Install & run with npm (global)

```bash
npm install -g @ci-dokumentor/cli
ci-dokumentor generate --source action.yml
```

### Install & run with pnpm (global)

```bash
pnpm add -g @ci-dokumentor/cli
ci-dokumentor generate --source action.yml
```

### Using Yarn (global)

```bash
yarn global add @ci-dokumentor/cli
ci-dokumentor generate --source action.yml
```

### Running from package.json scripts

Add a script to your repository's `package.json`:

```json
{
  "scripts": {
    "doc:generate": "@ci-dokumentor/cli generate --source action.yml"
  },
  "devDependencies": {
    "@ci-dokumentor/cli": "^0.0.1"
  }
}
```

Then run:

```bash
npm run doc:generate
# or
pnpm run doc:generate
```

### Local installation (project-specific)

You can also install the CLI locally in your project:

```bash
npm install --save-dev @ci-dokumentor/cli
# or
pnpm add -D @ci-dokumentor/cli
```

Then use it via npx or package scripts:

```bash
npx @ci-dokumentor/cli generate --source action.yml
```

## Related Documentation

For detailed CLI options and platform support, see:

- **[CLI Package](../packages/cli)** - Complete command-line interface reference and all available options
- **[Introduction](../intro)** - Quick start and other installation methods
