import { inject, injectable } from 'inversify';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { GeneratorService } from '@ci-dokumentor/core';
import { GenerateOptions } from '../interfaces/generate-options.interface.js';

export interface GenerateDocumentationUseCaseInput extends GenerateOptions {
    // Legacy field for backward compatibility
    type?: string;
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
        
        // Log platform options if provided
        if (input.repository?.platform) {
            this.logger.info(`Repository platform: ${input.repository.platform}`);
        }
        if (input.cicd?.platform) {
            this.logger.info(`CI/CD platform: ${input.cicd.platform}`);
        }
        if (input.type) {
            this.logger.info(`Legacy CI/CD type: ${input.type}`);
        }
        
        // Log section options if provided
        if (input.sections?.includeSections?.length) {
            this.logger.info(`Including sections: ${input.sections.includeSections.join(', ')}`);
        }
        if (input.sections?.excludeSections?.length) {
            this.logger.info(`Excluding sections: ${input.sections.excludeSections.join(', ')}`);
        }
        
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

        // Validate legacy type field for backward compatibility
        if (input.type) {
            const validTypes = ['github-actions'];
            if (!validTypes.includes(input.type)) {
                throw new Error(`Invalid type '${input.type}'. Valid types: ${validTypes.join(', ')}`);
            }
        }

        // Validate repository platform if provided
        if (input.repository?.platform) {
            const validRepositoryPlatforms = ['git', 'github'];
            if (!validRepositoryPlatforms.includes(input.repository.platform)) {
                throw new Error(`Invalid repository platform '${input.repository.platform}'. Valid platforms: ${validRepositoryPlatforms.join(', ')}`);
            }
        }

        // Validate CI/CD platform if provided
        if (input.cicd?.platform) {
            const validCicdPlatforms = ['github-actions'];
            if (!validCicdPlatforms.includes(input.cicd.platform)) {
                throw new Error(`Invalid CI/CD platform '${input.cicd.platform}'. Valid platforms: ${validCicdPlatforms.join(', ')}`);
            }
        }
    }
}
