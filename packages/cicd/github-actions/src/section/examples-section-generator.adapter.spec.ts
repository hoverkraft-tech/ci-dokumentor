import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { ExamplesSectionGenerator } from './examples-section-generator.adapter.js';
import { VersionService, SectionIdentifier, ManifestVersion, ReadableContent, FormatterAdapter, RepositoryProvider, ReaderAdapter } from '@ci-dokumentor/core';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory, RepositoryProviderMockFactory, VersionServiceMockFactory } from '@ci-dokumentor/core/tests';

describe('ExamplesSectionGenerator', () => {
  let mockFormatterAdapter: Mocked<FormatterAdapter>;
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

    mockFormatterAdapter = {
      heading: vi.fn(),
      lineBreak: vi.fn(),
      paragraph: vi.fn(),
      code: vi.fn(),
      appendContent: vi.fn()
    } as unknown as Mocked<FormatterAdapter>;

    mockRepositoryProvider = RepositoryProviderMockFactory.create();

    mockRepositoryProvider.getRepositoryInfo.mockResolvedValue(RepositoryInfoMockFactory.create({
      rootDir: '/test/repo',
    }));


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
        formatterAdapter: mockFormatterAdapter,
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
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(exampleContent));

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# Examples'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.code.mockReturnValue(Buffer.from('```yaml\ncode\n```'));
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('# Examples\ncode'));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result.toString()).not.toEqual("");
      expect(mockFormatterAdapter.heading).toHaveBeenCalledWith(Buffer.from('Examples'), 2);
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
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(exampleContent));

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# Examples'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));

      let capturedCode = '';
      mockFormatterAdapter.code.mockImplementation((content: ReadableContent) => {
        // Capture the processed code for verification
        capturedCode = content.toString();
        return Buffer.from('```yaml\nprocessed code\n```');
      });
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('# Examples\ncode'));

      // Act
      await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      // Verify the code content has been processed for version replacement
      expect(capturedCode).toContain('owner/test-action@abc123456789 # v1.0.0');
      expect(capturedCode).toContain('./@abc123456789 # v1.0.0');
      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });

    it('should find examples from destination file', async () => {
      // Arrange
      // Mock destination file with examples section
      const destinationContent = `# Test Action

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
`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(destinationContent));

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# heading'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.paragraph.mockReturnValue(Buffer.from('paragraph'));
      mockFormatterAdapter.code.mockReturnValue(Buffer.from('```yaml\ncode\n```'));
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('content'));

      // Act
      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result).not.toEqual(Buffer.alloc(0));
      expect(mockFormatterAdapter.heading).toHaveBeenCalledWith(Buffer.from('Basic Usage'), 5);
      expect(mockFormatterAdapter.paragraph).toHaveBeenCalledWith(Buffer.from('This is an advanced example.'));
      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });

    it('should throws on file system errors', async () => {
      // Arrange
      // Simulate permission error when trying to read examples
      mockReaderAdapter.resourceExists.mockImplementation(() => { throw new Error("EACCES, permission denied '/test/repo/examples'"); });

      // Act & Assert
      await expect(generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
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
        formatterAdapter: mockFormatterAdapter,
        manifest: mockWorkflow,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should handle version information without SHA', async () => {
      // Arrange
      const versionWithoutSha: ManifestVersion = {
        ref: 'v1.0.0'
      };

      mockVersionService.getVersion.mockResolvedValue(versionWithoutSha);

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      const destinationWithExamples = '# Examples\n\n' +
        '```yaml\n' +
        'uses: owner/test-action@v1.0.0\n' +
        '```\n';
      mockReaderAdapter.readResource.mockResolvedValue(Buffer.from(destinationWithExamples));
      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# heading'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.code.mockImplementation((content: Buffer) => {
        // Without SHA, version replacement shouldn't happen
        const codeStr = content.toString();
        expect(codeStr).toContain('uses: owner/test-action@v1.0.0');
        return Buffer.from('```yaml\ncode\n```');
      });
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('content'));

      // Act
      await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Assert
      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });
  });
});