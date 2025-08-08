import { CliApplication } from './application/cli-application.js';
import { initGlobalContainer } from './global-container.js';

/**
 * Main CLI function that creates and runs the CLI application
 */
export async function cli(): Promise<void> {
  const container = initGlobalContainer();

  const cliApp = container.get(CliApplication);
  return cliApp.run();
}
