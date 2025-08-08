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
            .option('-r, --repository <platform>', 'Repository platform').choices(supportedRepositoryPlatforms)
            .option('-c, --cicd <platform>', 'CI/CD platform').choices(supportedCicdPlatforms)
            .option('--include-sections <sections>', 'Comma-separated list of sections to include')
            .option('--exclude-sections <sections>', 'Comma-separated list of sections to exclude')
            .action(async (options) => {
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
}
