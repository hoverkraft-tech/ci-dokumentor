import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { GenerateCommand } from './generate-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';
import { CommandTester } from '../../../__tests__/command-tester.js';

describe('GenerateCommand', () => {
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
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('command configuration', () => {
    it('should have correct name and alias', () => {
      expect(generateCommand.name()).toBe('generate');
      expect(generateCommand.alias()).toBe('gen');
    });

    it('should have correct description', () => {
      expect(generateCommand.description()).toBe(
        'Generate documentation from CI/CD manifest files'
      );
    });

    it('should have all expected options', () => {
      const options = generateCommand.options;
      const optionFlags = options.map((opt) => opt.flags);

      expect(optionFlags).toContain('-s, --source <file>');
      expect(optionFlags).toContain('-d, --destination <file>');
      expect(optionFlags).toContain('-r, --repository <platform>');
      expect(optionFlags).toContain('-c, --cicd <platform>');
      expect(optionFlags).toContain('-i, --include-sections <sections>');
      expect(optionFlags).toContain('-e, --exclude-sections <sections>');
      expect(optionFlags).toContain('--dry-run');
    });
  });

  describe('option parsing', () => {
    it('should parse basic options correctly', async () => {
      // Arrange
      const args = ['--source', './test-source', '--destination', './test-destination'];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });
    });

    it('should parse repository platform options correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--repository',
        'github',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        repository: {
          platform: 'github',
        },
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });
    });

    it('should parse CI/CD platform options correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--cicd',
        'github-actions',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        cicd: {
          platform: 'github-actions',
        },
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });
    });

    it('should parse include sections correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--include-sections',
        'header,overview,badges',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        sections: {
          includeSections: ['header', 'overview', 'badges'],
        },
        dryRun: false,
        outputFormat: undefined,
      });
    });

    it('should parse exclude sections correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--exclude-sections',
        'license,security',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        sections: {
          excludeSections: ['license', 'security'],
        },
        dryRun: false,
        outputFormat: undefined,
      });
    });

    it('should handle both include and exclude sections', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--include-sections',
        'header,overview',
        '--exclude-sections',
        'license',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        sections: {
          includeSections: ['header', 'overview'],
          excludeSections: ['license'],
        },
        dryRun: false,
        outputFormat: undefined,
      });
    });

    it('should handle sections with whitespace correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--include-sections',
        ' header , overview , badges ',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        sections: {
          includeSections: ['header', 'overview', 'badges'],
        },
        dryRun: false,
        outputFormat: undefined,
      });
    });

    it('should filter out empty section names', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--include-sections',
        'header,,overview,',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        sections: {
          includeSections: ['header', 'overview'],
        },
        dryRun: false,
        outputFormat: undefined,
      });
    });

    it('should parse short options correctly', async () => {
      // Arrange
      const args = [
        '-s',
        './test-source',
        '-d',
        './test-destination',
        '-r',
        'github',
        '-c',
        'github-actions',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-destination',
        repository: {
          platform: 'github',
        },
        cicd: {
          platform: 'github-actions',
        },
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });
    });

    it('preAction should add provider options', async () => {
      // Arrange - mock a provider option
      mockGenerateDocumentationUseCase.getRepositorySupportedOptions.mockResolvedValue({
        foo: {
          flags: '--foo <value>',
          description: 'Foo description',
        }
      });

      // Act - parse with the dynamically added option
      const args = [
        '--source',
        './test-source',
        '--repository',
        'github',
        '--foo',
        'bar',
      ];

      await commandTester.test(args);

      expect(commandTester.getLoggerService().error).not.toHaveBeenCalled();
      expect(commandTester.getLoggerService().debug).not.toHaveBeenCalled();
      expect(commandTester.getLoggerService().warn).not.toHaveBeenCalled();

      // Assert - dynamic option was added and use case executed
      expect(mockGenerateDocumentationUseCase.getRepositorySupportedOptions).toHaveBeenCalledWith('github');

      const optionFlags = generateCommand.options.map((opt) => opt.flags);
      expect(optionFlags).toContain('--foo <value>');
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: undefined,
        repository: {
          platform: 'github',
          options: { foo: 'bar' }
        },
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });
    });

    it('preAction should set handle provider options with env', async () => {
      // Arrange - mock a provider option
      mockGenerateDocumentationUseCase.getRepositorySupportedOptions.mockResolvedValue({
        foo: {
          flags: '--foo <value>',
          description: 'Foo description',
          env: 'FOO_ENV',
        }
      });

      // Act - parse with the dynamically added option and a valid section
      const args = [
        '--source',
        './test-source',
        '--repository',
        'github',
      ];

      process.env.FOO_ENV = 'bar-from-env';

      await commandTester.test(args);

      // Assert - dynamic option was added and use case executed
      expect(mockGenerateDocumentationUseCase.getRepositorySupportedOptions).toHaveBeenCalledWith('github');

      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: undefined,
        repository: {
          platform: 'github',
          options: {
            foo: 'bar-from-env'
          },
        },
        dryRun: false,
        outputFormat: undefined,
        sections: {},
      });

    });

    it('preAction should set section choices', async () => {
      // Arrange - mock supported sections via service mocks
      mockGenerateDocumentationUseCase.getSupportedSections.mockReturnValue(['header', 'overview']);

      // Act - parse with the dynamically added option and a valid section
      const args = [
        '--source',
        './test-source',
        '--include-sections',
        'header',
      ];

      await commandTester.test(args);

      expect(commandTester.getLoggerService().error).not.toHaveBeenCalled();
      expect(commandTester.getLoggerService().debug).not.toHaveBeenCalled();
      expect(commandTester.getLoggerService().warn).not.toHaveBeenCalled();

      // Assert - dynamic option was added and use case executed
      expect(mockGenerateDocumentationUseCase.getSupportedSections).toHaveBeenCalled();

      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: undefined,
        sections: {
          includeSections: ['header'],
        },
        dryRun: false,
        outputFormat: undefined,
      });

    });

    it('unknown option should return an error', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-destination',
        '--unknown-option',
        'some-value',
      ];

      // Act
      await expect(commandTester.test(args)).rejects.toThrow('process.exit: 1');

      expect(commandTester.getLoggerService().error).toHaveBeenCalledWith(`error: unknown option '--unknown-option'\n`, undefined);
      expect(commandTester.getLoggerService().debug).not.toHaveBeenCalled();
      expect(commandTester.getLoggerService().warn).not.toHaveBeenCalled();

      expect(mockGenerateDocumentationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle dry-run option correctly', async () => {
      // Arrange
      const args = [
        '--source',
        './test-source',
        '--destination',
        './test-output',
        '--dry-run',
      ];

      // Act
      await commandTester.test(args);

      // Assert
      expect(mockGenerateDocumentationUseCase.execute).toHaveBeenCalledWith({
        source: './test-source',
        destination: './test-output',
        dryRun: true,
        outputFormat: undefined,
        sections: {},
      });
    });
  });
});
