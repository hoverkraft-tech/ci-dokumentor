import { inject, injectable, multiInject } from 'inversify';
import {
  COMMAND_IDENTIFIER,
  type Command,
} from '../interfaces/command.interface.js';
import {
  LOGGER_IDENTIFIER,
  type Logger,
} from '../interfaces/logger.interface.js';
import {
  PACKAGE_SERVICE_IDENTIFIER,
  type PackageService,
} from '../interfaces/package-service.interface.js';
import {
  PROGRAM_IDENTIFIER,
  type Program,
} from '../interfaces/program.interface.js';

/**
 * Main CLI application class that orchestrates command execution
 * Uses dependency injection to get commands directly via multiInject
 */
@injectable()
export class CliApplication {
  constructor(
    @inject(PROGRAM_IDENTIFIER) private readonly program: Program,
    @multiInject(COMMAND_IDENTIFIER) private readonly commands: Command[],
    @inject(PACKAGE_SERVICE_IDENTIFIER)
    private readonly packageService: PackageService,
    @inject(LOGGER_IDENTIFIER) private readonly logger: Logger
  ) {
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
   * Commands are self-configured through their configure() method
   */
  private registerCommands(): void {
    this.commands.forEach((command) => {
      // Configure the command (this sets up name, description, options, action)
      command.configure();

      // Add the configured command to the main program
      this.program.addCommand(command);
    });
  }
}
