import { appendFileSync } from 'fs';
import type { LoggerAdapter } from './logger.adapter.js';
import { inject, injectable } from 'inversify';


// Identifier for injecting the GitHub Actions output file path
export const GITHUB_OUTPUT_IDENTIFIER = Symbol('GITHUB_OUTPUT');

/**
 * GitHub Action logger adapter using workflow commands
 * See: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
 */
@injectable()
export class GitHubActionLoggerAdapter implements LoggerAdapter {

  constructor(
    @inject(GITHUB_OUTPUT_IDENTIFIER) private readonly injectedOutputPath?: string
  ) { }

  getFormat(): string {
    return 'github-action';
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    console.error(`::debug::${message}`);
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    console.log(message);
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.error(`::warning::${message}`);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(`::error::${message}`);
  }

  /**
   * Log a result message using GitHub Actions workflow commands
   */
  result(data: unknown): void {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Output GitHub Actions workflow commands for object data
      for (const [key, value] of Object.entries(data)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        this.setOutput(key, stringValue);
      }
    } else {
      // Handle arrays and primitive values as single result
      const stringValue = typeof data === 'string' ? data : JSON.stringify(data);
      this.setOutput('result', stringValue);
    }
  }

  private setOutput(key: string, value: string): void {
    if (!this.injectedOutputPath) {
      throw new Error('GitHub Actions output path is not defined.');
    }

    appendFileSync(this.injectedOutputPath, `${key}=${value}\n`, { encoding: 'utf8' });
  }
}