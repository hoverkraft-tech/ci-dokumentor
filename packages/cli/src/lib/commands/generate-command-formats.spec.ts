import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenerateCommand, GenerateCommandOptions } from './generate-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

describe('GenerateCommand Format Options', () => {
  let generateCommand: GenerateCommand;
  let mockUseCase: any;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn().mockResolvedValue({ 
        success: true, 
        message: 'Documentation generated successfully',
        outputPath: './README.md'
      }),
      getSupportedRepositoryPlatforms: vi.fn().mockReturnValue(['git', 'github']),
      getSupportedCicdPlatforms: vi.fn().mockReturnValue(['github-actions']),
    };

    generateCommand = new GenerateCommand(mockUseCase);
    generateCommand.configure();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('format option parsing', () => {
    it('should parse single format option', async () => {
      // Arrange
      const args = ['--source', './test-source', '--format', 'json'];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [{ type: 'json', destination: undefined }],
      });
    });

    it('should parse multiple format options', async () => {
      // Arrange
      const args = ['--source', './test-source', '--format', 'text,json,github-action'];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: undefined },
          { type: 'json', destination: undefined },
          { type: 'github-action', destination: undefined },
        ],
      });
    });

    it('should parse format with destinations', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--format', 'text,json',
        '--format-destination', 'text:./docs/README.md,json:./output.json'
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: './docs/README.md' },
          { type: 'json', destination: './output.json' },
        ],
      });
    });

    it('should parse format with console destinations', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--format', 'json,github-action',
        '--format-destination', 'json:stdout'
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'json', destination: 'stdout' },
          { type: 'github-action', destination: undefined },
        ],
      });
    });

    it('should handle whitespace in format options', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--format', ' text , json , github-action ',
        '--format-destination', ' text : ./docs.md , json : stdout '
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: './docs.md' },
          { type: 'json', destination: 'stdout' },
          { type: 'github-action', destination: undefined },
        ],
      });
    });

    it('should default to text format when no format specified', async () => {
      // Arrange
      const args = ['--source', './test-source'];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [{ type: 'text', destination: undefined }],
      });
    });

    it('should filter out empty format names', async () => {
      // Arrange
      const args = ['--source', './test-source', '--format', 'text,,json,'];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: undefined },
          { type: 'json', destination: undefined },
        ],
      });
    });

    it('should throw error for invalid format', async () => {
      // Arrange
      const args = ['--source', './test-source', '--format', 'invalid-format'];

      // Act & Assert
      await expect(generateCommand.parseAsync(args, { from: 'user' }))
        .rejects.toThrow('Invalid output format \'invalid-format\'. Valid formats: text, json, github-action');
    });

    it('should combine format and other options correctly', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--output', './custom-output',
        '--format', 'text,json',
        '--format-destination', 'json:stderr',
        '--repository', 'github',
        '--include-sections', 'header,overview'
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        output: './custom-output',
        repository: { platform: 'github' },
        sections: { includeSections: ['header', 'overview'] },
        outputFormats: [
          { type: 'text', destination: undefined },
          { type: 'json', destination: 'stderr' },
        ],
      });
    });
  });

  describe('format destination parsing edge cases', () => {
    it('should handle malformed format-destination', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--format', 'text,json',
        '--format-destination', 'malformed,text:./docs.md'
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: './docs.md' },
          { type: 'json', destination: undefined },
        ],
      });
    });

    it('should handle empty format-destination entries', async () => {
      // Arrange
      const args = [
        '--source', './test-source',
        '--format', 'text,json',
        '--format-destination', ',text:./docs.md,'
      ];

      // Act
      await generateCommand.parseAsync(args, { from: 'user' });

      // Assert
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        outputFormats: [
          { type: 'text', destination: './docs.md' },
          { type: 'json', destination: undefined },
        ],
      });
    });
  });
});