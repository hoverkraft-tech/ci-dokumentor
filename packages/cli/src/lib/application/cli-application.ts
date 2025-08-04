import { inject, injectable } from 'inversify';
import { Command } from 'commander';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { PACKAGE_SERVICE_IDENTIFIER, type PackageService } from '../interfaces/package-service.interface.js';
import { GenerateDocumentationUseCase } from '../usecases/generate-documentation.usecase.js';

/**
 * Main CLI application class that orchestrates command execution
 * Simplified approach without program dependency injection
 */
@injectable()
export class CliApplication {
    private readonly program: Command;

    constructor(
        @inject(PACKAGE_SERVICE_IDENTIFIER) private readonly packageService: PackageService,
        @inject(LOGGER_IDENTIFIER) private readonly logger: Logger,
        @inject(GenerateDocumentationUseCase) private readonly generateDocumentationUseCase: GenerateDocumentationUseCase
    ) {
        this.program = new Command();
        this.setupProgram();
        this.registerCommands();
    }

    /**
     * Run the CLI application with the provided arguments
     */
    async run(args?: string[]): Promise<void> {
        await this.program.parseAsync(args || process.argv);
    }

    /**
     * Setup the main program configuration
     */
    private setupProgram(): void {
        const packageInfo = this.packageService.getPackageInfo();

        this.program
            .name(packageInfo.name)
            .description(packageInfo.description)
            .version(packageInfo.version)
            .showHelpAfterError()
            .showSuggestionAfterError()
            .configureOutput({
                writeOut: (str: string) => this.logger.log(str),
                writeErr: (str: string) => this.logger.error(str),
            });
    }

    /**
     * Register all available commands manually
     */
    private registerCommands(): void {
        // Create generate command manually
        const generateCommand = new Command('generate')
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

        this.program.addCommand(generateCommand);
    }
}
