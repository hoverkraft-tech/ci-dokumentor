import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';
import { CommandTester } from '../../../__tests__/command-tester.js';
import { GenerateCommand } from './generate-command.js';
import mockFs from 'mock-fs';

describe('GenerateCommand - Multiple Files', () => {
  let generateCommand: GenerateCommand;
  let commandTester: CommandTester;
  let mockGenerateDocumentationUseCase: Mocked<GenerateDocumentationUseCase>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create mock use case
    mockGenerateDocumentationUseCase = {
      execute: vi.fn().mockResolvedValue({
        success: true,
        message: 'Documentation generated successfully',
        destination: './README.md',
      }) as Mocked<GenerateDocumentationUseCase['execute']>,
      getSupportedRepositoryPlatforms: vi
        .fn()
        .mockReturnValue(['git', 'github']) as Mocked<GenerateDocumentationUseCase['getSupportedRepositoryPlatforms']>,
      getSupportedCicdPlatforms: vi.fn().mockReturnValue(['github-actions']) as Mocked<GenerateDocumentationUseCase['getSupportedCicdPlatforms']>,
      getSupportedSections: vi
        .fn()
        .mockReturnValue(['header', 'overview', 'usage', 'inputs', 'outputs']) as Mocked<GenerateDocumentationUseCase['getSupportedSections']>,
      getRepositorySupportedOptions: vi.fn().mockResolvedValue([]) as Mocked<GenerateDocumentationUseCase['getRepositorySupportedOptions']>,
      getSectionSupportedOptions: vi.fn().mockReturnValue({}) as Mocked<GenerateDocumentationUseCase['getSectionSupportedOptions']>,
    } as Mocked<GenerateDocumentationUseCase>;

    const processExitMock = ((code?: number | string | null | undefined) => {
      throw new Error('process.exit: ' + code);
    }) as unknown as typeof process.exit;

    // Bind mocks to container
    vi
      .spyOn(process, 'exit')
      .mockImplementation(processExitMock);

    generateCommand = new GenerateCommand(mockGenerateDocumentationUseCase);
    commandTester = new CommandTester(generateCommand);

    // Mock filesystem for glob pattern tests
    mockFs({
      'action1.yml': 'content1',
      'action2.yml': 'content2',
      'workflows': {
        'ci.yml': 'content3',
        'cd.yml': 'content4',
      },
      'other.txt': 'not yaml',
    });
  });

  afterEach(() => {
    mockFs.restore();
    vi.resetAllMocks();
  });

  describe('multiple file processing', () => {
    it('should process multiple source files specified directly', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--source', 'action2.yml',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'action1.yml' })
      );
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'action2.yml' })
      );
    });

    it('should process files matching glob pattern', async () => {
      // Arrange
      const args = ['--source', '*.yml'];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'action1.yml' })
      );
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'action2.yml' })
      );
    });

    it('should process files matching nested glob pattern', async () => {
      // Arrange
      const args = ['--source', 'workflows/*.yml'];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'workflows/cd.yml' })
      );
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'workflows/ci.yml' })
      );
    });

    it('should reject --destination when processing multiple files', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--source', 'action2.yml',
        '--destination', 'README.md',
      ];

      // Act & Assert
      await expect(commandTester.test(args)).rejects.toThrow(
        '--destination option cannot be used when processing multiple files'
      );
    });

    it('should allow --destination when processing single file', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--destination', 'README.md',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'action1.yml',
          destination: 'README.md',
        })
      );
    });

    it('should respect custom concurrency setting', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--source', 'action2.yml',
        '--concurrency', '1',
      ];

      // Act
      await commandTester.test(args);

      // Assert - With concurrency 1, calls should be sequential
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in individual files and continue processing', async () => {
      // Arrange
      mockGenerateDocumentationUseCase.execute
        .mockResolvedValueOnce({
          success: true,
          destination: './README1.md',
        })
        .mockRejectedValueOnce(new Error('Failed to process action2.yml'))
        .mockResolvedValueOnce({
          success: true,
          destination: './README3.md',
        });

      const args = [
        '--source', 'action1.yml',
        '--source', 'action2.yml',
        '--source', 'workflows/ci.yml',
      ];

      // Act & Assert
      await expect(commandTester.test(args)).rejects.toThrow(
        'Failed to process 1 of 3 files'
      );
      
      // All files should be attempted
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it('should error when no files match glob pattern', async () => {
      // Arrange
      const args = ['--source', 'nonexistent/*.yml'];

      // Act & Assert
      await expect(commandTester.test(args)).rejects.toThrow(
        'No source files found matching the provided pattern(s)'
      );
    });

    it('should validate concurrency parameter', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--concurrency', '-1',
      ];

      // Act & Assert
      await expect(commandTester.test(args)).rejects.toThrow(
        '--concurrency must be a positive integer'
      );
    });

    it('should apply common options to all files', async () => {
      // Arrange
      const args = [
        '--source', 'action1.yml',
        '--source', 'action2.yml',
        '--dry-run',
        '--repository', 'github',
        '--cicd', 'github-actions',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'action1.yml',
          dryRun: true,
          repository: { platform: 'github' },
          cicd: { platform: 'github-actions' },
        })
      );
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'action2.yml',
          dryRun: true,
          repository: { platform: 'github' },
          cicd: { platform: 'github-actions' },
        })
      );
    });
  });
});
