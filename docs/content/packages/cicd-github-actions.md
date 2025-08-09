---
sidebar_position: 5
---

# CI/CD GitHub Actions Package

The `@ci-dokumentor/cicd-github-actions` package provides comprehensive support for parsing GitHub Actions and workflows, generating professional documentation.

## Overview

This package provides:

- **GitHub Actions Parser** - Parse `action.yml` and `action.yaml` files
- **GitHub Workflows Parser** - Parse workflow files from `.github/workflows/`
- **Documentation Generator** - Generate comprehensive Markdown documentation
- **Section Generators** - Modular documentation sections (inputs, outputs, usage, etc.)
- **Template System** - Customizable documentation templates

## Installation

```bash
# Usually installed as a dependency of other packages
npm install @ci-dokumentor/cicd-github-actions
```

## Key Components

### GitHubActionsParser

The main parser for GitHub Actions and workflows:

```typescript
class GitHubActionsParser implements IManifestParser {
  async parse(filePath: string): Promise<GitHubActionsManifest>
  supportsFile(filePath: string): boolean
  async parseAction(filePath: string): Promise<GitHubAction>
  async parseWorkflow(filePath: string): Promise<GitHubWorkflow>
}
```

#### Supported File Types

- ✅ **Action Files** - `action.yml`, `action.yaml`
- ✅ **Workflow Files** - `.github/workflows/*.yml`, `.github/workflows/*.yaml`
- ✅ **Composite Actions** - Actions using `runs.using: 'composite'`
- ✅ **Docker Actions** - Actions using `runs.using: 'docker'`
- ✅ **Node.js Actions** - Actions using `runs.using: 'node16'`, `'node20'`

### GitHubActionsGeneratorAdapter

The documentation generator for GitHub Actions:

```typescript
class GitHubActionsGeneratorAdapter implements IDocumentationGenerator {
  async generate(manifest: GitHubActionsManifest, repository: Repository): Promise<string>
  async generateAction(action: GitHubAction, repository: Repository): Promise<string>
  async generateWorkflow(workflow: GitHubWorkflow, repository: Repository): Promise<string>
}
```

#### Generated Documentation Sections

- 📋 **Overview** - Name, description, author, and branding
- 📥 **Inputs** - Detailed input parameters with types and defaults
- 📤 **Outputs** - Output descriptions and usage examples
- 🚀 **Usage** - Complete usage examples with proper YAML syntax
- 🔒 **Security** - Security considerations and best practices
- 📄 **License** - License information and attribution

## Usage Examples

### Parse GitHub Action

```typescript
import { GitHubActionsParser } from '@ci-dokumentor/cicd-github-actions';

const parser = new GitHubActionsParser();

// Parse action.yml file
const action = await parser.parseAction('./action.yml');

console.log(action.name);         // 'My Action'
console.log(action.description);  // 'Action description'
console.log(action.inputs);       // Input definitions
console.log(action.outputs);      // Output definitions
console.log(action.runs);         // Runtime configuration
```

### Parse GitHub Workflow

```typescript
// Parse workflow file
const workflow = await parser.parseWorkflow('./.github/workflows/ci.yml');

console.log(workflow.name);       // 'Continuous Integration'
console.log(workflow.on);         // Trigger configuration
console.log(workflow.jobs);       // Job definitions
console.log(workflow.env);        // Environment variables
```

### Generate Documentation

```typescript
import { GitHubActionsGeneratorAdapter } from '@ci-dokumentor/cicd-github-actions';

const generator = new GitHubActionsGeneratorAdapter();

// Generate action documentation
const actionDocs = await generator.generateAction(action, repository);

// Generate workflow documentation  
const workflowDocs = await generator.generateWorkflow(workflow, repository);

console.log(actionDocs);   // Complete Markdown documentation
```

## GitHub Action Manifest

### Action Structure

```typescript
interface GitHubAction {
  name: string;
  description: string;
  author?: string;
  
  inputs?: Record<string, ActionInput>;
  outputs?: Record<string, ActionOutput>;
  
  runs: ActionRuns;
  branding?: ActionBranding;
}
```

### Input Definition

```typescript
interface ActionInput {
  description: string;
  required?: boolean;
  default?: string;
  deprecationMessage?: string;
}
```

### Output Definition

```typescript
interface ActionOutput {
  description: string;
  value?: string;
}
```

### Runtime Configuration

```typescript
interface ActionRuns {
  using: 'node16' | 'node20' | 'composite' | 'docker';
  main?: string;           // For Node.js actions
  pre?: string;           // Pre-execution script
  post?: string;          // Post-execution script
  image?: string;         // For Docker actions
  steps?: CompositeStep[]; // For composite actions
}
```

## GitHub Workflow Manifest

### Workflow Structure

```typescript
interface GitHubWorkflow {
  name?: string;
  on: WorkflowTriggers;
  
  permissions?: WorkflowPermissions;
  concurrency?: WorkflowConcurrency;
  env?: Record<string, string>;
  defaults?: WorkflowDefaults;
  
  jobs: Record<string, WorkflowJob>;
}
```

### Trigger Configuration

```typescript
interface WorkflowTriggers {
  push?: PushTrigger;
  pull_request?: PullRequestTrigger;
  schedule?: ScheduleTrigger[];
  workflow_dispatch?: WorkflowDispatchTrigger;
  // ... other triggers
}
```

### Job Definition

```typescript
interface WorkflowJob {
  name?: string;
  'runs-on': string | string[];
  needs?: string | string[];
  if?: string;
  
  strategy?: JobStrategy;
  permissions?: WorkflowPermissions;
  env?: Record<string, string>;
  
  steps: WorkflowStep[];
}
```

## Documentation Generation

### Section Generators

The package uses modular section generators for flexible documentation:

#### InputsSectionGenerator

```typescript
class InputsSectionGenerator {
  generate(action: GitHubAction): Buffer {
    // Generates inputs table with:
    // - Parameter names
    // - Descriptions  
    // - Required/optional status
    // - Default values
    // - Type information (if available)
  }
}
```

#### OutputsSectionGenerator

```typescript
class OutputsSectionGenerator {
  generate(action: GitHubAction): Buffer {
    // Generates outputs table with:
    // - Output names
    // - Descriptions
    // - Usage examples
  }
}
```

#### UsageSectionGenerator

```typescript
class UsageSectionGenerator {
  generate(action: GitHubAction, repository: Repository): Buffer {
    // Generates usage examples:
    // - Basic usage
    // - With all inputs
    // - Multiple use cases
    // - Proper YAML formatting
  }
}
```

#### SecuritySectionGenerator

```typescript
class SecuritySectionGenerator {
  generate(action: GitHubAction): Buffer {
    // Generates security considerations:
    // - Input validation recommendations
    // - Security best practices
    // - Common pitfalls to avoid
  }
}
```

### Custom Templates

You can customize the generated documentation using templates:

```typescript
// Custom template
const customTemplate = `
# {{name}}

{{description}}

**Author:** {{author}}

## Installation

\`\`\`yaml
- uses: {{repository.owner}}/{{repository.name}}@{{version}}
\`\`\`

{{sections.inputs}}
{{sections.outputs}}
{{sections.usage}}
{{sections.security}}
`;

// Use custom template
const generator = new GitHubActionsGeneratorAdapter({
  template: customTemplate
});
```

## Advanced Features

### Composite Actions Support

```typescript
// Parse composite action
const compositeAction = await parser.parseAction('./composite-action.yml');

// Composite actions have steps instead of main/pre/post
console.log(compositeAction.runs.steps);
// [
//   { uses: 'actions/checkout@v4' },
//   { run: 'npm install' },
//   { run: 'npm test' }
// ]
```

### Docker Actions Support

```typescript
// Parse Docker action
const dockerAction = await parser.parseAction('./docker-action.yml');

console.log(dockerAction.runs.image);     // 'Dockerfile'
console.log(dockerAction.runs.args);      // Command arguments
console.log(dockerAction.runs.entrypoint); // Custom entrypoint
```

### Workflow Matrix Support

```typescript
// Parse workflow with matrix strategy
const workflow = await parser.parseWorkflow('./.github/workflows/matrix.yml');

const job = workflow.jobs.test;
console.log(job.strategy?.matrix);
// {
//   'node-version': ['16', '18', '20'],
//   'os': ['ubuntu-latest', 'windows-latest', 'macos-latest']
// }
```

### Environment Variables Analysis

```typescript
// Analyze environment variables
const workflow = await parser.parseWorkflow('./.github/workflows/deploy.yml');

console.log(workflow.env);           // Global environment variables
console.log(workflow.jobs.deploy.env); // Job-specific environment variables

// Generate environment documentation
const envDocs = generator.generateEnvironmentDocumentation(workflow);
```

## Error Handling

### Parser Errors

```typescript
// Invalid YAML syntax
class InvalidYamlError extends CiDokumentorError {
  constructor(filePath: string, yamlError: Error) {
    super(`Invalid YAML in ${filePath}: ${yamlError.message}`, 'INVALID_YAML');
  }
}

// Missing required fields
class MissingRequiredFieldError extends CiDokumentorError {
  constructor(filePath: string, field: string) {
    super(`Missing required field '${field}' in ${filePath}`, 'MISSING_REQUIRED_FIELD');
  }
}

// Unsupported action type
class UnsupportedActionTypeError extends CiDokumentorError {
  constructor(actionType: string) {
    super(`Unsupported action type: ${actionType}`, 'UNSUPPORTED_ACTION_TYPE');
  }
}
```

### Graceful Error Handling

```typescript
try {
  const action = await parser.parseAction('./action.yml');
} catch (error) {
  if (error instanceof InvalidYamlError) {
    console.error('Please fix the YAML syntax errors');
  } else if (error instanceof MissingRequiredFieldError) {
    console.error('Please add the missing required fields');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Testing

### Mock Parser

```typescript
// Mock parser for testing
const mockParser = mock<GitHubActionsParser>();

// Setup mock action
const mockAction: GitHubAction = {
  name: 'Test Action',
  description: 'A test action',
  inputs: {
    'test-input': {
      description: 'Test input',
      required: true
    }
  },
  outputs: {
    'test-output': {
      description: 'Test output'
    }
  },
  runs: {
    using: 'node20',
    main: 'index.js'
  }
};

when(mockParser.parseAction('./action.yml'))
  .thenResolve(mockAction);
```

### Test Builders

```typescript
// Action builder for tests
const testAction = new GitHubActionBuilder()
  .withName('Test Action')
  .withDescription('A test action')
  .withAuthor('Test Author')
  .withInput('input1', 'First input', true, 'default1')
  .withOutput('output1', 'First output')
  .withNodeRuns('index.js')
  .withBranding('star', 'blue')
  .build();

// Workflow builder for tests
const testWorkflow = new GitHubWorkflowBuilder()
  .withName('Test Workflow')
  .withPushTrigger(['main'])
  .withJob('test', job => job
    .withRunsOn('ubuntu-latest')
    .withStep('Checkout', 'actions/checkout@v4')
    .withStep('Test', 'npm test')
  )
  .build();
```

## Performance Optimization

### Caching

```typescript
// Enable parsing cache
const parser = new GitHubActionsParser({
  cacheEnabled: true,
  cacheTtl: 300000  // 5 minutes
});

// First parse reads from file
const action1 = await parser.parseAction('./action.yml');

// Second parse uses cache (if file unchanged)
const action2 = await parser.parseAction('./action.yml');
```

### Batch Processing

```typescript
// Process multiple files efficiently
const actionFiles = ['action.yml', 'action2.yml', 'action3.yml'];

const actions = await Promise.all(
  actionFiles.map(file => parser.parseAction(file))
);

const documentation = await Promise.all(
  actions.map(action => generator.generateAction(action, repository))
);
```

## Building and Development

### Build Commands

```bash
# Build the package
nx build cicd-github-actions

# Run tests
nx test cicd-github-actions

# Run linting
nx lint cicd-github-actions
```

### Development Dependencies

```json
{
  "dependencies": {
    "@ci-dokumentor/core": "workspace:*",
    "@ci-dokumentor/repository-git": "workspace:*",
    "@ci-dokumentor/repository-github": "workspace:*",
    "feather-icons": "^4.29.2",
    "inversify": "^7.5.2",
    "yaml": "^2.8.0"
  },
  "devDependencies": {
    "@types/feather-icons": "^4.29.4"
  }
}
```

## Integration Examples

### CLI Integration

```typescript
// Register GitHub Actions support in CLI
container.bind<IManifestParser>(TYPES.ManifestParser)
  .to(GitHubActionsParser)
  .whenTargetNamed('github-actions');

container.bind<IDocumentationGenerator>(TYPES.DocumentationGenerator)
  .to(GitHubActionsGeneratorAdapter)
  .whenTargetNamed('github-actions');
```

### Workflow Integration

```yaml
# Auto-generate documentation in CI
name: Generate Documentation
on:
  push:
    paths: ['action.yml', '.github/workflows/*.yml']

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs/'
```

## Related Packages

- [Core Package](./core) - Base abstractions and services
- [Repository GitHub](./repository-github) - GitHub repository integration
- [CLI Package](./cli) - Command-line interface
- [Repository Git](./repository-git) - Git repository support

## Contributing

When contributing to the cicd-github-actions package:

1. **Support New Features** - Keep up with GitHub Actions feature updates
2. **Comprehensive Testing** - Test with various action and workflow types
3. **Documentation Quality** - Ensure generated docs are professional and complete
4. **Performance** - Optimize parsing and generation for large files
5. **Compatibility** - Support different GitHub Actions versions and formats