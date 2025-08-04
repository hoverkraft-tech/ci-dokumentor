import { inject, injectable } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import type { Command } from '../interfaces/command.interface.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

/**
 * Generate command implementation that creates a configured Commander Command
 * Uses composition and minimal DI to avoid conflicts with Commander.js
 */
@injectable()
export class GenerateCommand implements Command {
    constructor(
        @inject(GenerateDocumentationUseCase)
        private readonly generateDocumentationUseCase: GenerateDocumentationUseCase
    ) {}

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
