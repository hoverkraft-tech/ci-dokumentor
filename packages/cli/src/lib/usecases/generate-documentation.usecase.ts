import { inject, injectable } from 'inversify';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { GeneratorService, RepositoryService } from '@ci-dokumentor/core';

export interface GenerateDocumentationUseCaseInput {
    /**
     * Source directory containing CI/CD files
     */
    source: string;
    
    /**
     * Output directory for generated documentation
     */
    output: string;
    
    /**
     * Repository platform options
     */
    repository?: {
        /**
         * The repository platform to use
         * If not specified, auto-detected from the repository
         */
        platform?: string;
    };
    
    /**
     * CI/CD platform options
     */
    cicd?: {
        /**
         * The CI/CD platform to use
         * If not specified, auto-detected from available manifest files
         */
        platform?: string;
    };
    
    /**
     * Section generator options
     */
    sections?: {
        /**
         * List of section identifiers to include in generation
         * If not specified, all available sections are included
         */
        includeSections?: string[];
        
        /**
         * List of section identifiers to exclude from generation
         */
        excludeSections?: string[];
        
        /**
         * Section-specific configuration options
         */
        sectionConfig?: Record<string, Record<string, unknown>>;
    };
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
        
        // Auto-detect repository platform if not provided
        let repositoryPlatform = input.repository?.platform;
        if (!repositoryPlatform) {
            repositoryPlatform = await this.repositoryService.autoDetectRepositoryPlatform();
            if (repositoryPlatform) {
                this.logger.info(`Auto-detected repository platform: ${repositoryPlatform}`);
            }
        } else {
            this.logger.info(`Repository platform: ${repositoryPlatform}`);
        }
        
        // Get CI/CD adapter (either from platform input or auto-detect)
        let adapter;
        if (input.cicd?.platform) {
            this.logger.info(`CI/CD platform: ${input.cicd.platform}`);
            adapter = this.generatorService.getGeneratorAdapterByPlatform(input.cicd.platform);
            if (!adapter) {
                throw new Error(`No generator adapter found for CI/CD platform '${input.cicd.platform}'`);
            }
        } else {
            adapter = this.generatorService.autoDetectCicdAdapter(input.source);
            if (adapter) {
                this.logger.info(`Auto-detected CI/CD platform: ${adapter.getPlatformName()}`);
            } else {
                throw new Error(`No CI/CD platform could be auto-detected for source '${input.source}'. Please specify one using --cicd option.`);
            }
        }
        
        // Log section options if provided
        if (input.sections?.includeSections?.length) {
            this.logger.info(`Including sections: ${input.sections.includeSections.join(', ')}`);
        }
        if (input.sections?.excludeSections?.length) {
            this.logger.info(`Excluding sections: ${input.sections.excludeSections.join(', ')}`);
        }
        
        // Generate documentation using the specific CI/CD platform adapter
        await this.generatorService.generateDocumentationForPlatform(input.source, adapter);

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
}
