import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  VersionService,
} from '@ci-dokumentor/core';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory, VersionServiceMockFactory } from '@ci-dokumentor/core/tests';
import {
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubWorkflowSecret,
  GitHubWorkflowCallInput,
} from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { UsageSectionGenerator } from './usage-section-generator.adapter.js';

describe('UsageSectionGenerator', () => {
  let mockVersionService: Mocked<VersionService>;
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: UsageSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create(),
    });

    mockVersionService = VersionServiceMockFactory.create();

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new UsageSectionGenerator(mockVersionService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Usage section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Usage);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      const cases: Array<{ title: string; inputs?: Record<string, GitHubActionInput>; version?: { ref: string; sha?: string }; expected: string }> = [
        {
          title: 'simple GitHub Action without inputs',
          inputs: undefined,
          version: undefined,
          expected: `## Usage

\`\`\`yaml
- uses: owner/repo
\`\`\`
`
        },
        {
          title: 'GitHub Action with simple inputs',
          inputs: {
            'api-key': { description: 'API key for authentication', required: true },
            timeout: { description: 'Request timeout in seconds', default: '30' },
          },
          version: undefined,
          expected: `## Usage

\`\`\`yaml
- uses: owner/repo
  with:
    # API key for authentication
    # This input is required.
    api-key: ""

    # Request timeout in seconds
    # Default: \`30\`
    timeout: "30"
\`\`\`
`
        },
        {
          title: 'GitHub Action with complex inputs',
          inputs: {
            'boolean-input': { description: 'A boolean input', default: 'true', required: false },
            'number-input': { description: 'A number input', required: true },
            'optional-input': { description: 'An optional input' },
            'input-with-multiline-description': { description: 'An input\nwith multiline\n  \ndescription' },
            'input-with-code-block-description': {
              description: `An input with code block description:
\`\`\`
const x = 10;
console.log(x);
\`\`\`

End of description.
` },
          },
          version: undefined,
          expected: `## Usage

\`\`\`\`yaml
- uses: owner/repo
  with:
    # A boolean input
    # Default: \`true\`
    boolean-input: "true"

    # A number input
    # This input is required.
    number-input: ""

    # An optional input
    optional-input: ""

    # An input
    # with multiline
    #
    # description
    input-with-multiline-description: ""

    # An input with code block description:
    # \`\`\`
    # const x = 10;
    # console.log(x);
    # \`\`\`
    #
    # End of description.
    input-with-code-block-description: ""
\`\`\`\`
`
        },
        {
          title: 'usage with version information when available',
          inputs: undefined,
          version: { ref: '1.0.0', sha: '08c6903cd8c0fde910a37f88322edcfb5dd907a8' },
          expected: `## Usage

\`\`\`yaml
- uses: owner/repo@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # 1.0.0
\`\`\`
`
        },
        {
          title: 'usage with ref when sha not available',
          inputs: undefined,
          version: { ref: '1.0.0' },
          expected: `## Usage

\`\`\`yaml
- uses: owner/repo@1.0.0
\`\`\`
`
        },
      ];

      it.each(cases)('should generate usage section for $title', async ({ inputs, version, expected }) => {
        // Arrange
        const manifest: GitHubAction = inputs ? GitHubActionMockFactory.create({ inputs }) : GitHubActionMockFactory.create();

        if (version) {
          mockVersionService.getVersion.mockResolvedValue(version);
        }

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert
        expect(result.toString()).toBe(expected);
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate usage section for simple workflow without inputs', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/workflow.yml',
          name: 'Test Workflow',
          on: { push: { branches: ['main'] }, workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  workflow:
    uses: owner/repo/.github/workflows/workflow.yml
\`\`\`
`
        );
      });

      it('should generate usage section for workflow with inputs and secrets', async () => {
        // Arrange
        const inputs: Record<string, GitHubWorkflowCallInput> = {
          environment: {
            description: 'Deployment environment',
            type: 'string',
            required: true,
          },
          version: {
            description: 'Version to deploy',
            type: 'string',
            default: 'latest',
          },
          debug: {
            description: 'Enable debug mode',
            type: 'boolean',
            default: 'false',
          },
        };

        const secrets: Record<string, GitHubWorkflowSecret> = {
          DEPLOY_TOKEN: {
            description: 'Token for deployment',
            required: true,
          },
          API_KEY: {
            description: 'Optional API key',
          },
        };

        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/deploy.yml',
          name: 'Deploy Workflow',
          on: { push: { branches: ['main'] }, workflow_call: { inputs, secrets } },
          permissions: { contents: 'read', deployments: 'write' },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Deploy Workflow
on:
  push:
    branches:
      - main
permissions:
  contents: read
  deployments: write
jobs:
  deploy:
    uses: owner/repo/.github/workflows/deploy.yml
    secrets:
      # Token for deployment
      # This input is required.
      DEPLOY_TOKEN: ""

      # Optional API key
      API_KEY: ""
    with:
      # Deployment environment
      # This input is required.
      environment: ""

      # Version to deploy
      # Default: \`latest\`
      version: latest

      # Enable debug mode
      # Default: \`false\`
      debug: false
\`\`\`
`
        );
      });

      it('should generate usage section for workflow with only push trigger', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/ci.yml',
          name: 'CI Workflow',
          on: {
            push: { branches: ['main', 'develop'] },
            pull_request: { branches: ['main'] },
            workflow_dispatch: {},
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: CI Workflow
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
jobs:
  ci:
    uses: owner/repo/.github/workflows/ci.yml
\`\`\`
`
        );
      });

      it('should generate usage section for workflow with complex on triggers', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/release.yml',
          name: 'Release Workflow',
          on: { release: { types: ['published'] }, schedule: [{ cron: '0 0 * * 0' }], workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Release Workflow
on:
  release:
    types:
      - published
  schedule:
    - cron: 0 0 * * 0
jobs:
  release:
    uses: owner/repo/.github/workflows/release.yml
\`\`\`
`
        );
      });

      it('should handle workflow with no on triggers gracefully', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/test.yml',
          name: 'Test Workflow',
          on: { workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  test:
    uses: owner/repo/.github/workflows/test.yml
\`\`\`
`
        );
      });

      it('should generate usage section for workflow with version information', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/workflow.yml',
          name: 'Test Workflow',
          on: { push: { branches: ['main'] }, workflow_dispatch: {} },
        });

        const version = {
          ref: '1.0.0',
          sha: 'abc123def456',
        };

        // Arrange: mock version resolution
        mockVersionService.getVersion.mockResolvedValue(version);

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  workflow:
    uses: owner/repo/.github/workflows/workflow.yml@abc123def456 # 1.0.0
\`\`\`
`
        );
      });
    });
  });
});
