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
        return this
            .name('generate')
            .alias('gen')
            .description('Generate documentation from CI/CD configuration files')
            .option('-s, --source <dir>', 'Source directory containing CI/CD files', '.')
            .option('-o, --output <dir>', 'Output directory for generated documentation', './docs')
            .option('-t, --type <type>', 'Type of CI/CD system (legacy, use --cicd-platform instead)', 'github-actions')
            .option('--repository-platform <platform>', 'Repository platform (git, github)')
            .option('--cicd-platform <platform>', 'CI/CD platform (github-actions)')
            .option('--include-sections <sections>', 'Comma-separated list of sections to include')
            .option('--exclude-sections <sections>', 'Comma-separated list of sections to exclude')
            .action(async (options) => {
                const generateOptions: GenerateOptions = {
                    source: options.source,
                    output: options.output,
                };

                // Handle repository platform options
                if (options.repositoryPlatform) {
                    generateOptions.repository = {
                        platform: options.repositoryPlatform as 'git' | 'github'
                    };
                }

                // Handle CI/CD platform options (prefer new option over legacy)
                if (options.cicdPlatform) {
                    generateOptions.cicd = {
                        platform: options.cicdPlatform as 'github-actions'
                    };
                } else if (options.type !== 'github-actions') {
                    // Only set cicd platform from type if it's not the default
                    generateOptions.cicd = {
                        platform: options.type as 'github-actions'
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

                await this.generateDocumentationUseCase.execute({
                    ...generateOptions,
                    // Include legacy type for backward compatibility
                    type: options.type
                });
            });
    }
}
