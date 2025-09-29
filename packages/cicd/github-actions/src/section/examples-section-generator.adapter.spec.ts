import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { VersionService, SectionIdentifier, ManifestVersion, ReadableContent, FormatterAdapter, RepositoryProvider, ReaderAdapter, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory, RepositoryProviderMockFactory, VersionServiceMockFactory } from '@ci-dokumentor/core/tests';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { initTestContainer } from '../container.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { ExamplesSectionGenerator } from './examples-section-generator.adapter.js';

describe('ExamplesSectionGenerator', () => {
  let formatterAdapter: FormatterAdapter;
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let mockVersionService: Mocked<VersionService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  let generator: ExamplesSectionGenerator;

  const mockGitHubAction: GitHubAction = GitHubActionMockFactory.create();
  const mockGitHubWorkflow: GitHubWorkflow = GitHubWorkflowMockFactory.create();

  const mockVersion: ManifestVersion = {
    sha: 'abc123456789',
    ref: 'v1.0.0'
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create({
        rootDir: '/test/repo',
      }),
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    mockVersionService = VersionServiceMockFactory.create();
    mockVersionService.getVersion.mockResolvedValue(mockVersion);

    mockReaderAdapter = ReaderAdapterMockFactory.create();

    generator = new ExamplesSectionGenerator(mockVersionService, mockReaderAdapter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Examples identifier', () => {
      expect(generator.getSectionIdentifier()).toBe(SectionIdentifier.Examples);
    });
  });

  describe('getSectionOptions', () => {
    it('should return version option descriptor', () => {
      const options = generator.getSectionOptions();

      expect(options).toHaveProperty('version');
      expect(options.version).toHaveProperty('flags', '--version <version>');
      expect(options.version).toHaveProperty('description');
    });
  });

  describe('setSectionOptions', () => {
    it('should set version option', () => {
      generator.setSectionOptions({ version: 'v1.0.0' });
      // This method sets internal state, no direct way to test except through integration
    });
  });

  describe('generateSection', () => {
    it('should return empty buffer when no examples found', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result.toString()).toEqual("");
    });

    it('should generate examples section with examples from directory', async () => {
      // Arrange
      // Mock examples directory with YAML file containing action usage
      mockReaderAdapter.containerExists.mockReturnValue(true);
      mockReaderAdapter.readContainer.mockResolvedValue(['/test/examples/example1.yaml']);

      const exampleContent = `name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo@v1.0.0
        with:
          input: value`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(exampleContent));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result.toString()).not.toEqual("");
    });

    it('should process code snippets and replace version information', async () => {
      // Arrange
      // Mock examples directory with YAML file containing action usage
      mockReaderAdapter.containerExists.mockReturnValue(true);
      mockReaderAdapter.readContainer.mockResolvedValue(['/test/examples/example1.yaml']);

      const exampleContent = `name: Example Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo@v1.0.0
        with:
          input: value
      - uses: ./
        with:
          local: true`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(exampleContent));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      // Verify the code content has been processed for version replacement
      expect(result.toString()).toEqual(`## Examples

### /test/examples/example1

\`\`\`yaml
name: Example Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo@abc123456789 # v1.0.0
        with:
          input: value
      - uses: ./@abc123456789 # v1.0.0
        with:
          local: true
\`\`\`

### /test/examples/example1

\`\`\`yaml
name: Example Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo@abc123456789 # v1.0.0
        with:
          input: value
      - uses: ./@abc123456789 # v1.0.0
        with:
          local: true
\`\`\`
`);
    });

    describe('from destination file', () => {

      it('should return empty content when destination file does not exist', async () => {
        // Arrange
        mockReaderAdapter.resourceExists.mockReturnValue(false);

        // Act
        const result = await generator.generateSection({
          formatterAdapter: formatterAdapter,
          manifest: mockGitHubAction,
          repositoryProvider: mockRepositoryProvider,
          destination: '/test/destination.md',
        });

        // Assert
        expect(result.toString()).toEqual("");
      });

      type GenerateSectionScenario = {
        name: string;
        manifest: GitHubAction | GitHubWorkflow;
        version?: ManifestVersion;
        destinationContent: string;
        expectedContent: string;
      };

      const generateSectionScenarios: GenerateSectionScenario[] = [
        {
          name: 'finds examples from destination file',
          manifest: mockGitHubAction,
          destinationContent: `### Basic Usage

\`\`\`yaml
uses: owner/repo@v1.0.0
with:
  input: value
\`\`\`

### Advanced Usage

This is an advanced example.

\`\`\`yaml
uses: owner/repo@latest
with:
  input: advanced
\`\`\`
`,
          expectedContent: `## Examples

### Basic Usage

\`\`\`yaml
uses: owner/repo@abc123456789 # v1.0.0
with:
  input: value
\`\`\`

### Advanced Usage

This is an advanced example.

\`\`\`yaml
uses: owner/repo@abc123456789 # v1.0.0
with:
  input: advanced
\`\`\`
`,
        },

        {
          name: 'handles version information without SHA',
          manifest: mockGitHubAction,
          version: { ref: 'v1.0.0' },
          destinationContent: `\`\`\`yaml
uses: owner/repo@v1.0.0
\`\`\`
`,
          expectedContent: `## Examples

\`\`\`yaml
uses: owner/repo@v1.0.0
\`\`\`

`,
        },
        {
          name: 'preserves headings when parsing destination content',
          manifest: mockGitHubAction,
          destinationContent: `### Example using in a full workflow

\`\`\`\`yaml
name: Test Action

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Run test action
        uses: owner/repo@v1.0.0
        with:
          input: value
\`\`\`\`
`,
          expectedContent: `## Examples

### Example using in a full workflow

\`\`\`yaml
name: Test Action

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Run test action
        uses: owner/repo@abc123456789 # v1.0.0
        with:
          input: value
\`\`\`
`,
        },
        {
          name: 'handles various fenced code block formats',
          manifest: mockGitHubAction,
          destinationContent: `### Triple backticks

\`\`\`yaml
name: Example 1
uses: owner/repo@v1.0.0
\`\`\`

### Quadruple backticks

\`\`\`\`yaml
name: Example 2
uses: owner/repo@v1.0.0
\`\`\`\`

### Five backticks

\`\`\`\`\`yaml
name: Example 3
uses: owner/repo@v1.0.0
\`\`\`\`\`
`,
          expectedContent: `## Examples

### Triple backticks

\`\`\`yaml
name: Example 1
uses: owner/repo@abc123456789 # v1.0.0
\`\`\`

### Quadruple backticks

\`\`\`yaml
name: Example 2
uses: owner/repo@abc123456789 # v1.0.0
\`\`\`

### Five backticks

\`\`\`yaml
name: Example 3
uses: owner/repo@abc123456789 # v1.0.0
\`\`\`
`,
        },
        {
          name: 'should work with GitHub Workflow manifests',
          manifest: mockGitHubWorkflow,
          destinationContent: `### Using the action in a workflow

\`\`\`yaml
name: CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo/.github/workflows/test-workflow.yml@v1.0.0
        with:
          input: value
\`\`\`
`,
          expectedContent: `## Examples

### Using the action in a workflow

\`\`\`yaml
name: CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/repo/.github/workflows/test-workflow.yml@abc123456789 # v1.0.0
        with:
          input: value
\`\`\`
`,
        }


      ];

      it.each(generateSectionScenarios)('$name', async ({ manifest, version, destinationContent, expectedContent }) => {
        // Arrange
        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(`
# Test Action

<!-- examples:start -->

## Examples

${destinationContent}

<!-- examples:end -->`));

        mockVersionService.getVersion.mockResolvedValue(version ? version : mockVersion);


        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: '/test/destination.md',
        });

        // Assert
        expect(result.toString()).toEqual(expectedContent);
      });
    });



    it('should throws on file system errors', async () => {
      // Arrange
      // Simulate permission error when trying to read examples
      mockReaderAdapter.resourceExists.mockImplementation(() => { throw new Error("EACCES, permission denied '/test/repo/examples'"); });

      // Act & Assert
      await expect(generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      })).rejects.toThrow("EACCES, permission denied '/test/repo/examples'");
    });
  });
});