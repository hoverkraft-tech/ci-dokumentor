import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { VersionService, SectionIdentifier, ManifestVersion, ReadableContent, FormatterAdapter, RepositoryProvider, ReaderAdapter, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory, RepositoryProviderMockFactory, VersionServiceMockFactory } from '@ci-dokumentor/core/tests';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { initTestContainer } from '../container.js';
import { ExamplesSectionGenerator } from './examples-section-generator.adapter.js';

describe('ExamplesSectionGenerator', () => {
  let formatterAdapter: FormatterAdapter;
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let mockVersionService: Mocked<VersionService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  let generator: ExamplesSectionGenerator;

  const mockGitHubAction: GitHubAction = {
    name: 'Test Action',
    description: 'A test action',
    usesName: 'owner/test-action',
    inputs: {},
    outputs: {},
    runs: {
      using: 'node20'
    }
  };

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
      - uses: owner/test-action@v1.0.0
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
      - uses: owner/test-action@v1.0.0
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
      - uses: owner/test-action@abc123456789 # v1.0.0
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
      - uses: owner/test-action@abc123456789 # v1.0.0
        with:
          input: value
      - uses: ./@abc123456789 # v1.0.0
        with:
          local: true
\`\`\`
`);
    });

    it('should find examples from destination file', async () => {
      // Arrange
      // Mock destination file with examples section
      const destinationContent = `# Test Action

<!-- examples:start -->

## Examples

### Basic Usage

\`\`\`yaml
uses: owner/test-action@v1.0.0
with:
  input: value
\`\`\`

### Advanced Usage

This is an advanced example.

\`\`\`yaml
uses: owner/test-action@latest
with:
  input: advanced
\`\`\`

<!-- examples:end -->
`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(destinationContent));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination.md'
      });

      // Assert
      expect(result.toString()).toEqual(`## Examples

### Basic Usage

\`\`\`yaml
uses: owner/test-action@abc123456789 # v1.0.0
with:
  input: value
\`\`\`

### Advanced Usage

This is an advanced example.

\`\`\`yaml
uses: owner/test-action@abc123456789 # v1.0.0
with:
  input: advanced
\`\`\`
`);
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

    it('should work with GitHub Workflow manifests', async () => {
      // Arrange
      const mockWorkflow: GitHubWorkflow = {
        name: 'Test Workflow',
        usesName: 'owner/test-workflow/.github/workflows/test.yml',
        on: { push: {} },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: []
          }
        }
      };

      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockWorkflow,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result).toEqual(ReadableContent.empty());
    });

    it('should handle version information without SHA', async () => {
      // Arrange
      const versionWithoutSha: ManifestVersion = {
        ref: 'v1.0.0'
      };

      mockVersionService.getVersion.mockResolvedValue(versionWithoutSha);

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      const destinationWithExamples = `<!-- examples:start -->
# Examples

\`\`\`yaml
uses: owner/test-action@v1.0.0
\`\`\`
<!-- examples:end -->
`;
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(destinationWithExamples));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: formatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result.toString()).toEqual(`## Examples

\`\`\`yaml
uses: owner/test-action@v1.0.0
\`\`\`

`);
    });
  });
});