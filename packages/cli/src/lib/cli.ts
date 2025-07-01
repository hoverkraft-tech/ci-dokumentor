import { CliApplication } from './application/cli-application.js';
import { initContainer } from './container.js';

/**
 * Main CLI function that creates and runs the CLI application
 */
export function cli(): Promise<void> {
  const container = initContainer();

  const cliApp = container.get(CliApplication);
  return cliApp.run();
}
