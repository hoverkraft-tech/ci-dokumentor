import { inject, injectable, multiInject } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import { COMMAND_IDENTIFIER, type Command } from '../interfaces/command.interface.js';
import { LOGGER_IDENTIFIER, type Logger } from '../interfaces/logger.interface.js';
import { PACKAGE_SERVICE_IDENTIFIER, type PackageService } from '../interfaces/package-service.interface.js';

/**
 * Main CLI application class that orchestrates command execution
 * Creates its own Commander.js program instance to avoid DI issues
 */
@injectable()
export class CliApplication {
    private program: CommanderCommand;

    constructor(
        @multiInject(COMMAND_IDENTIFIER) private readonly commands: Command[],
        @inject(PACKAGE_SERVICE_IDENTIFIER) private readonly packageService: PackageService,
        @inject(LOGGER_IDENTIFIER) private readonly logger: Logger
    ) {
        // Create Commander.js program directly to avoid DI issues
        this.program = new CommanderCommand();
        this.setupProgram();
        this.registerCommands();
    }

    /**
     * Run the CLI application with the provided arguments
     */
    async run(args?: string[]): Promise<void> {
        await this.program.parseAsync(args);
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
     * Register all available commands using addCommand
     * Commands create their own Commander command instances which are properly initialized
     */
    private registerCommands(): void {
        this.commands.forEach(command => {
            // Create a properly initialized Commander command instance
            const commanderCommand = command.createCommand();

            // Add the configured command to the main program
            this.program.addCommand(commanderCommand);
        });
    }
}
