import { Command as CommanderCommand } from 'commander';
import { initContainer } from './container.js';
import { ConsoleLogger } from './services/console-logger.service.js';
import { FilePackageService } from './services/file-package.service.js';
import { GenerateDocumentationUseCase } from './usecases/generate-documentation.usecase.js';

/**
 * Main CLI function that creates and runs the CLI application
 * Uses hybrid approach: DI for business logic, manual creation for CLI layer
 */
export async function cli(): Promise<void> {
  // Initialize DI container for core business logic
  const container = initContainer();
  
  // Get business logic via DI
  const generateUseCase = container.get(GenerateDocumentationUseCase);
  
  // Create CLI-specific services manually to avoid Commander.js conflicts
  const logger = new ConsoleLogger();
  const packageService = new FilePackageService();

  // Create Commander program directly - no DI
  const program = new CommanderCommand();
  
  // Setup program
  const packageInfo = packageService.getPackageInfo();
  program
    .name(packageInfo.name)
    .description(packageInfo.description)
    .version(packageInfo.version)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .configureOutput({
      writeOut: (str: string) => logger.log(str),
      writeErr: (str: string) => logger.error(str),
    });

  // Create generate command directly - no DI
  const generateCommand = new CommanderCommand();
  generateCommand
    .name('generate')
    .alias('gen')
    .description('Generate documentation from CI/CD configuration files')
    .option('-s, --source <dir>', 'Source directory containing CI/CD files', '.')
    .option('-o, --output <dir>', 'Output directory for generated documentation', './docs')
    .option('-t, --type <type>', 'Type of CI/CD system', 'github-actions')
    .action(async (options) => {
      await generateUseCase.execute({
        source: options.source,
        output: options.output,
        type: options.type
      });
    });

  // Add the command to the program
  program.addCommand(generateCommand);

  // Parse arguments
  await program.parseAsync();
}
