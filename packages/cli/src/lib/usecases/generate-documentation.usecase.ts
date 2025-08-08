import { inject, injectable } from 'inversify';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { GeneratorService, RepositoryService } from '@ci-dokumentor/core';
import { GenerateOptions } from '../interfaces/generate-options.interface.js';

export interface GenerateDocumentationUseCaseInput extends GenerateOptions {
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
        @inject(GeneratorService) private readonly generatorService: GeneratorService,
        @inject(RepositoryService) private readonly repositoryService: RepositoryService
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

        // Validate repository platform if provided
        if (input.repository?.platform) {
            const validRepositoryPlatforms = this.getSupportedRepositoryPlatforms();
            if (!validRepositoryPlatforms.includes(input.repository.platform)) {
                throw new Error(`Invalid repository platform '${input.repository.platform}'. Valid platforms: ${validRepositoryPlatforms.join(', ')}`);
            }
        }

        // Validate CI/CD platform if provided
        if (input.cicd?.platform) {
            const validCicdPlatforms = this.getSupportedCicdPlatforms();
            if (!validCicdPlatforms.includes(input.cicd.platform)) {
                throw new Error(`Invalid CI/CD platform '${input.cicd.platform}'. Valid platforms: ${validCicdPlatforms.join(', ')}`);
            }
        }
    }

    /**
     * Get list of supported repository platforms based on registered providers
     */
    getSupportedRepositoryPlatforms(): string[] {
        return this.repositoryService.getSupportedRepositoryPlatforms();
    }

    /**
     * Get list of supported CI/CD platforms based on registered generator adapters
     */
    getSupportedCicdPlatforms(): string[] {
        return this.generatorService.getSupportedCicdPlatforms();
    }

    /**
     * Get supported sections for a specific CI/CD platform
     */
    getSupportedSectionsForCicdPlatform(platform: string): string[] {
        return this.generatorService.getSupportedSectionsForPlatform(platform);
    }

    /**
     * Get all supported sections from all registered generator adapters
     */
    getAllSupportedSections(): string[] {
        return this.generatorService.getAllSupportedSections();
    }
}
