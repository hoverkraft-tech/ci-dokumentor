import { inject, injectable, injectFromBase } from 'inversify';
import { BaseCommand } from './base-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';
import { GenerateOptions } from '../interfaces/generate-options.interface.js';

/**
 * Generate command implementation that extends Commander Command
 * Self-configures and calls the GenerateDocumentationUseCase
 */
@injectable()
@injectFromBase({
    extendConstructorArguments: true,
})
export class GenerateCommand extends BaseCommand {
    constructor(
        @inject(GenerateDocumentationUseCase)
        private readonly generateDocumentationUseCase: GenerateDocumentationUseCase
    ) {
        super();
    }

    /**
     * Configure the command with name, description, options, and action
     */
    configure(): this {
        // Get supported platforms from the use case
        const supportedRepositoryPlatforms = this.generateDocumentationUseCase.getSupportedRepositoryPlatforms();
        const supportedCicdPlatforms = this.generateDocumentationUseCase.getSupportedCicdPlatforms();

        return this
            .name('generate')
            .alias('gen')
            .description('Generate documentation from CI/CD configuration files')
            .option('-s, --source <dir>', 'Source directory containing CI/CD files', '.')
            .option('-o, --output <dir>', 'Output directory for generated documentation', './docs')
            .option('-r, --repository <platform>', `Repository platform (choices: ${supportedRepositoryPlatforms.join(', ')})`)
            .option('-c, --cicd <platform>', `CI/CD platform (choices: ${supportedCicdPlatforms.join(', ')})`)
            .option('--include-sections <sections>', 'Comma-separated list of sections to include')
            .option('--exclude-sections <sections>', 'Comma-separated list of sections to exclude')
            .action(async (options: any) => {
                // Validate platform options if provided
                this.validatePlatformOptions(options);
                
                // Validate section options if provided
                if (options.includeSections || options.excludeSections) {
                    this.validateSectionOptions(options);
                }

                const generateOptions: GenerateOptions = {
                    source: options.source,
                    output: options.output,
                };

                // Handle repository platform options
                if (options.repository) {
                    generateOptions.repository = {
                        platform: options.repository
                    };
                }

                // Handle CI/CD platform options
                if (options.cicd) {
                    generateOptions.cicd = {
                        platform: options.cicd
                    };
                }

                // Handle section options
                if (options.includeSections || options.excludeSections) {
                    generateOptions.sections = {};
                    
                    if (options.includeSections) {
                        generateOptions.sections.includeSections = options.includeSections
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter((s: string) => s.length > 0);
                    }
                    
                    if (options.excludeSections) {
                        generateOptions.sections.excludeSections = options.excludeSections
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter((s: string) => s.length > 0);
                    }
                }

                await this.generateDocumentationUseCase.execute(generateOptions);
            });
    }

    /**
     * Validate platform options against supported platforms
     */
    private validatePlatformOptions(options: any): void {
        const supportedRepositoryPlatforms = this.generateDocumentationUseCase.getSupportedRepositoryPlatforms();
        const supportedCicdPlatforms = this.generateDocumentationUseCase.getSupportedCicdPlatforms();

        // Validate repository platform
        if (options.repository && !supportedRepositoryPlatforms.includes(options.repository)) {
            throw new Error(
                `Invalid repository platform '${options.repository}'. ` +
                `Valid platforms: ${supportedRepositoryPlatforms.join(', ')}`
            );
        }

        // Validate CI/CD platform
        if (options.cicd && !supportedCicdPlatforms.includes(options.cicd)) {
            throw new Error(
                `Invalid CI/CD platform '${options.cicd}'. ` +
                `Valid platforms: ${supportedCicdPlatforms.join(', ')}`
            );
        }
    }

    /**
     * Validate section options against supported sections
     */
    private validateSectionOptions(options: any): void {
        let supportedSections: string[];

        // If CI/CD platform is specified, get sections for that platform
        if (options.cicd) {
            supportedSections = this.generateDocumentationUseCase.getSupportedSectionsForCicdPlatform(options.cicd);
            
            if (supportedSections.length === 0) {
                // Fallback to all sections if platform-specific sections are not available
                supportedSections = this.generateDocumentationUseCase.getAllSupportedSections();
            }
        } else {
            // If no CI/CD platform is specified, use all supported sections
            supportedSections = this.generateDocumentationUseCase.getAllSupportedSections();
        }

        // Validate included sections
        if (options.includeSections) {
            const includedSections = options.includeSections.split(',').map((s: string) => s.trim());
            const invalidSections = includedSections.filter((section: string) => !supportedSections.includes(section));
            
            if (invalidSections.length > 0) {
                const platformInfo = options.cicd ? ` for CI/CD platform '${options.cicd}'` : '';
                throw new Error(
                    `Invalid section(s) '${invalidSections.join(', ')}'${platformInfo}. ` +
                    `Valid sections: ${supportedSections.join(', ')}`
                );
            }
        }

        // Validate excluded sections
        if (options.excludeSections) {
            const excludedSections = options.excludeSections.split(',').map((s: string) => s.trim());
            const invalidSections = excludedSections.filter((section: string) => !supportedSections.includes(section));
            
            if (invalidSections.length > 0) {
                const platformInfo = options.cicd ? ` for CI/CD platform '${options.cicd}'` : '';
                throw new Error(
                    `Invalid section(s) '${invalidSections.join(', ')}'${platformInfo}. ` +
                    `Valid sections: ${supportedSections.join(', ')}`
                );
            }
        }
    }
}
