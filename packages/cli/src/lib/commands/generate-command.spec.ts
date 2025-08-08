import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Container } from 'inversify';
import { GenerateCommand } from './generate-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

describe('GenerateCommand', () => {
    let container: Container;
    let generateCommand: GenerateCommand;
    let mockUseCase: Partial<GenerateDocumentationUseCase>;

    beforeEach(() => {
        container = new Container();
        
        // Create mock use case
        mockUseCase = {
            execute: vi.fn().mockResolvedValue({
                success: true,
                message: 'Documentation generated successfully',
                outputPath: './docs'
            })
        };

        // Bind mocks to container
        container.bind(GenerateDocumentationUseCase).toConstantValue(mockUseCase as GenerateDocumentationUseCase);
        container.bind(GenerateCommand).to(GenerateCommand);

        // Get the command instance
        generateCommand = container.get(GenerateCommand);
        generateCommand.configure();
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
            expect(generateCommand.description()).toBe('Generate documentation from CI/CD configuration files');
        });

        it('should have all expected options', () => {
            const options = generateCommand.options;
            const optionFlags = options.map(opt => opt.flags);

            expect(optionFlags).toContain('-s, --source <dir>');
            expect(optionFlags).toContain('-o, --output <dir>');
            expect(optionFlags).toContain('-t, --type <type>');
            expect(optionFlags).toContain('--repository-platform <platform>');
            expect(optionFlags).toContain('--cicd-platform <platform>');
            expect(optionFlags).toContain('--include-sections <sections>');
            expect(optionFlags).toContain('--exclude-sections <sections>');
        });
    });

    describe('option parsing', () => {
        it('should parse basic options correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--type', 'github-actions'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions'
            });
        });

        it('should parse repository platform options correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--repository-platform', 'github'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                repository: {
                    platform: 'github'
                }
            });
        });

        it('should parse CI/CD platform options correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--cicd-platform', 'github-actions'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                cicd: {
                    platform: 'github-actions'
                }
            });
        });

        it('should parse include sections correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--include-sections', 'header,overview,badges'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                sections: {
                    includeSections: ['header', 'overview', 'badges']
                }
            });
        });

        it('should parse exclude sections correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--exclude-sections', 'license,security'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                sections: {
                    excludeSections: ['license', 'security']
                }
            });
        });

        it('should handle both include and exclude sections', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--include-sections', 'header,overview', '--exclude-sections', 'license'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                sections: {
                    includeSections: ['header', 'overview'],
                    excludeSections: ['license']
                }
            });
        });

        it('should handle sections with whitespace correctly', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--include-sections', ' header , overview , badges '];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                sections: {
                    includeSections: ['header', 'overview', 'badges']
                }
            });
        });

        it('should filter out empty section names', async () => {
            // Arrange
            const args = ['generate', '--source', './test-source', '--output', './test-output', '--include-sections', 'header,,overview,'];

            // Act
            await generateCommand.parseAsync(args, { from: 'user' });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                source: './test-source',
                output: './test-output',
                type: 'github-actions',
                sections: {
                    includeSections: ['header', 'overview']
                }
            });
        });
    });
});