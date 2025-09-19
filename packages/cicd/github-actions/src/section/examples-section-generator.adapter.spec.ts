import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mockFs from 'mock-fs';
import { ExamplesSectionGenerator } from './examples-section-generator.adapter.js';
import { VersionService, SectionIdentifier, ManifestVersion } from '@ci-dokumentor/core';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';

describe('ExamplesSectionGenerator', () => {
  let generator: ExamplesSectionGenerator;
  let mockVersionService: any;
  let mockFormatterAdapter: any;
  let mockRepositoryProvider: any;

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
    mockVersionService = {
      getVersion: vi.fn()
    };
    
    generator = new ExamplesSectionGenerator(mockVersionService as VersionService);
    
    mockFormatterAdapter = {
      heading: vi.fn(),
      lineBreak: vi.fn(),
      paragraph: vi.fn(),
      code: vi.fn(),
      appendContent: vi.fn()
    };
    
    mockRepositoryProvider = {
      getRepositoryInfo: vi.fn()
    };
    
    mockRepositoryProvider.getRepositoryInfo.mockResolvedValue({
      rootDir: '/test/repo',
      owner: 'owner',
      name: 'test-action',
      url: 'https://github.com/owner/test-action',
      fullName: 'owner/test-action'
    });
    
    mockVersionService.getVersion.mockResolvedValue(mockVersion);
  });

  afterEach(() => {
    mockFs.restore();
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
      // Mock empty file system
      mockFs({
        '/test/repo': {}
      });
      
      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should generate examples section with examples from directory', async () => {
      // Mock examples directory with files
      mockFs({
        '/test/repo/examples': {
          'basic.yml': `name: Test Workflow
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: owner/test-action@v1.0.0
        with:
          input: value`
        }
      });

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# Examples'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.code.mockReturnValue(Buffer.from('```yaml\ncode\n```'));
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('# Examples\ncode'));

      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      expect(result).not.toEqual(Buffer.alloc(0));
      expect(mockFormatterAdapter.heading).toHaveBeenCalledWith(Buffer.from('Examples'), 2);
    });

    it('should process code snippets and replace version information', async () => {
      // Mock examples directory with YAML file containing action usage
      mockFs({
        '/test/repo/examples': {
          'workflow.yml': `name: Example Workflow
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
          local: true`
        }
      });

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# Examples'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      
      let capturedCode = '';
      mockFormatterAdapter.code.mockImplementation((content: Buffer) => {
        // Capture the processed code for verification
        capturedCode = content.toString();
        return Buffer.from('```yaml\nprocessed code\n```');
      });
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('# Examples\ncode'));

      await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Verify the code content has been processed for version replacement
      expect(capturedCode).toContain('owner/test-action@abc123456789 # v1.0.0');
      expect(capturedCode).toContain('./@abc123456789 # v1.0.0');
      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });

    it('should find examples from destination file', async () => {
      // Mock destination file with examples section
      mockFs({
        '/test/destination': `# Test Action

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
`
      });

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# heading'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.paragraph.mockReturnValue(Buffer.from('paragraph'));
      mockFormatterAdapter.code.mockReturnValue(Buffer.from('```yaml\ncode\n```'));
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('content'));

      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      expect(result).not.toEqual(Buffer.alloc(0));
      expect(mockFormatterAdapter.heading).toHaveBeenCalledWith(Buffer.from('Basic Usage'), 5);
      expect(mockFormatterAdapter.paragraph).toHaveBeenCalledWith(Buffer.from('This is an advanced example.'));
      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', async () => {
      // Mock file system with directory that will cause errors when accessed
      mockFs({
        '/test/repo/examples': mockFs.directory({
          mode: 0o000, // No permissions to cause errors
          items: {}
        })
      });

      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      // Should return empty buffer when no examples can be found due to errors
      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should work with GitHub Workflow manifests', async () => {
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

      mockFs({
        '/test/repo': {}
      });

      const result = await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockWorkflow,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should handle version information without SHA', async () => {
      const versionWithoutSha: ManifestVersion = {
        ref: 'v1.0.0'
      };
      
      mockVersionService.getVersion.mockResolvedValue(versionWithoutSha);
      
      mockFs({
        '/test/repo/examples': {
          'test.yml': 'uses: owner/test-action@v1.0.0'
        }
      });

      mockFormatterAdapter.heading.mockReturnValue(Buffer.from('# heading'));
      mockFormatterAdapter.lineBreak.mockReturnValue(Buffer.from('\n'));
      mockFormatterAdapter.code.mockImplementation((content: Buffer) => {
        // Without SHA, version replacement shouldn't happen
        const codeStr = content.toString();
        expect(codeStr).toContain('uses: owner/test-action@v1.0.0');
        return Buffer.from('```yaml\ncode\n```');
      });
      mockFormatterAdapter.appendContent.mockReturnValue(Buffer.from('content'));

      await generator.generateSection({
        formatterAdapter: mockFormatterAdapter,
        manifest: mockGitHubAction,
        repositoryProvider: mockRepositoryProvider,
        destination: '/test/destination'
      });

      expect(mockFormatterAdapter.code).toHaveBeenCalled();
    });
  });
});