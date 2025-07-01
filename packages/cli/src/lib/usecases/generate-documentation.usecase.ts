import { inject, injectable } from 'inversify';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { GeneratorService } from '@ci-dokumentor/core';

export interface GenerateDocumentationUseCaseInput {
    source: string;
    output: string;
    type: string;
}

export interface GenerateDocumentationUseCaseOutput {
    success: boolean;
    message: string;
    outputPath?: string;
}

/**
 * Use case for generating documentation from CI/CD configuration files
 * Following clean architecture principles
 */
@injectable()
export class GenerateDocumentationUseCase {
    constructor(
        @inject(LOGGER_IDENTIFIER) private readonly logger: Logger,
        @inject(GeneratorService) private readonly generatorService: GeneratorService
    ) { }

    async execute(input: GenerateDocumentationUseCaseInput): Promise<GenerateDocumentationUseCaseOutput> {
        // Validate input
        this.validateInput(input);

        this.logger.info('Starting documentation generation...');
        this.logger.info(`Source directory: ${input.source}`);
        this.logger.info(`Output directory: ${input.output}`);
        this.logger.info(`CI/CD type: ${input.type}`);
        // Use the core generation service to generate documentation
        await this.generatorService.generateDocumentation(input.source);

        this.logger.info('Documentation generated successfully!');
        this.logger.info(`Output saved to: ${input.output}`);

        return {
            success: true,
            message: 'Documentation generated successfully',
            outputPath: input.output
        };
    }

    private validateInput(input: GenerateDocumentationUseCaseInput): void {
        if (!input.source) {
            throw new Error('Source directory is required');
        }

        if (!input.output) {
            throw new Error('Output directory is required');
        }

        const validTypes = ['github-actions'];
        if (!validTypes.includes(input.type)) {
            throw new Error(`Invalid type '${input.type}'. Valid types: ${validTypes.join(', ')}`);
        }
    }
}
