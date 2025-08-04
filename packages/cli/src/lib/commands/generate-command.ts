import { inject, injectable } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import { BaseCommand } from './base-command.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

/**
 * Generate command implementation that creates a configured Commander Command
 * Uses composition instead of inheritance to avoid DI conflicts
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
     * Create and configure a Commander command instance
     */
    createCommand(): CommanderCommand {
        const command = new CommanderCommand();
        
        return command
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
