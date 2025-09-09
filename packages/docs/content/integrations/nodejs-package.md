---
sidebar_position: 2
---

# Node.js package

## Using the published package: `ci-dokumentor`

The project is published as `ci-dokumentor`. Below are common ways to run it.

### One-off with npx

```bash
npx ci-dokumentor --help
```

### Install & run with npm (global)

```bash
npm install -g ci-dokumentor
ci-dokumentor generate --source action.yml
```

### Install & run with pnpm (global)

```bash
pnpm add -g ci-dokumentor
ci-dokumentor generate --source action.yml
```

### Using Yarn (global)

```bash
yarn global add ci-dokumentor
ci-dokumentor generate --source action.yml
```

### Running from package.json scripts

Add a script to your repository's `package.json`:

```json
{
  "scripts": {
    "doc:generate": "ci-dokumentor generate --source action.yml"
  }
}
```

Then run:

```bash
npm run doc:generate
# or
pnpm run doc:generate
```

## Related Documentation

For detailed CLI options and platform support, see:

- **[CLI Package](../packages/cli)** - Complete command-line interface reference and all available options
- **[Introduction](../intro)** - Quick start and other installation methods
