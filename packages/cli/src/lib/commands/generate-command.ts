import { inject, injectable } from 'inversify';
import { BaseCommand } from './base-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

/**
 * Generate command implementation that extends Commander Command
 * Self-configures and calls the GenerateDocumentationUseCase
 */
@injectable()
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
            .option('-t, --type <type>', 'Type of CI/CD system', 'github-actions')
            .action(async (options) => {
                await this.generateDocumentationUseCase.execute({
                    source: options.source,
                    output: options.output,
                    type: options.type
                });
            });
    }
}
