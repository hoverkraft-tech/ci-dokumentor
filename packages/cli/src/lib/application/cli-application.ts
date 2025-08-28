import { inject, injectable, multiInject } from 'inversify';
import { Option } from 'commander';
import {
  COMMAND_IDENTIFIER,
  type Command,
} from '../commands/command.js';
import {
  PACKAGE_SERVICE_IDENTIFIER,
  type PackageService,
} from '../package/package-service.js';
import {
  PROGRAM_IDENTIFIER,
  type Program,
} from './program.js';
import { LoggerService } from '../logger/logger.service.js';
import { ProgramConfiguratorService } from './program-configurator.service.js';

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
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(ProgramConfiguratorService) private readonly programConfiguratorService: ProgramConfiguratorService
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
      .version(packageInfo.version);

    const supportedFormats = this.loggerService.getSupportedFormats();
    const outputFormatOption = new Option(
      '-o, --output-format <format>',
      'Output format for the CLI'
    ).choices(supportedFormats);
    outputFormatOption.default(supportedFormats[0]);
    this.program.addOption(outputFormatOption);

    this.configureProgram(this.program);
  }

  private configureProgram(program: Program): void {
    this.programConfiguratorService.configureOutput(program);
    this.programConfiguratorService.configureHelp(program);
  }

  /**
   * Register all available commands using addCommand
   * Commands are self-configured through their configure() method
   */
  private registerCommands(): void {
    this.commands.forEach((command) => {
      // Configure the command (this should sets up name, description, options, action...)
      command.configure();
      this.configureProgram(command);

      // Add the configured command to the main program
      this.program.addCommand(command);
    });
  }
}
