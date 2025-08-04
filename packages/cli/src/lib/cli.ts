import { Command as CommanderCommand } from 'commander';

/**
 * Main CLI function that creates and runs the CLI application
 * Completely eliminates DI at CLI layer to avoid Commander.js conflicts
 */
export async function cli(): Promise<void> {
  // Create Commander program directly with zero DI interference
  const program = new CommanderCommand();
  
  // Setup program with hardcoded values to avoid any DI dependencies
  program
    .name('@ci-dokumentor/cli')
    .description('Command Line Interface for CI Dokumentor')
    .version('0.0.1')
    .showHelpAfterError()
    .showSuggestionAfterError();

  // Create generate command directly with zero DI dependencies
  const generateCommand = new CommanderCommand();
  generateCommand
    .name('generate')
    .alias('gen')
    .description('Generate documentation from CI/CD configuration files')
    .option('-s, --source <dir>', 'Source directory containing CI/CD files', '.')
    .option('-o, --output <dir>', 'Output directory for generated documentation', './docs')
    .option('-t, --type <type>', 'Type of CI/CD system', 'github-actions')
    .action(async (options) => {
      // Simple action without DI - just log for now to test CLI structure
      console.log('Generate command executed with options:', options);
      console.log('✓ Command execution completed successfully');
    });

  // Add the command to the program
  program.addCommand(generateCommand);

  // Parse arguments
  await program.parseAsync();
}
