// Test script to understand the Commander.js issue
import { Command } from 'commander';

console.log('Testing basic Commander.js functionality...');

const program = new Command();
const subCommand = new Command();

// Configure sub-command
subCommand
  .name('generate')
  .description('Generate documentation')
  .action(() => {
    console.log('Generate command executed');
  });

// Add sub-command to program
program.addCommand(subCommand);

// Configure main program
program
  .name('test-cli')
  .description('Test CLI')
  .version('1.0.0');

// Test with help command
try {
  console.log('Parsing help command...');
  await program.parseAsync(['node', 'test-cli', 'help']);
  console.log('Help command parsed successfully');
} catch (error) {
  console.error('Error parsing help command:', error.message);
}