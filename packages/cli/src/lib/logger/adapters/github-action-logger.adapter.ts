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
   * Log a result message using GitHub Actions output file
   */
  result(data: unknown): void {

    if (Array.isArray(data)) {
      return this.resultArray(data);
    }
    if (typeof data === 'object' && data !== null) {
      return this.resultObject(data);
    }
    return this.setOutput('result', data);
  }

  private resultArray(data: unknown[]): void {
    this.setOutput('result', data);
  }

  private resultObject(data: object): void {
    for (const [key, value] of Object.entries(data)) {
      this.setOutput(key, value);
    }
  }

  private setOutput(key: string, data: unknown): void {
    if (!this.injectedOutputPath) {
      throw new Error('GitHub Actions output path is not defined.');
    }
    const stringValue = typeof data === 'string' ? data : JSON.stringify(data);

    appendFileSync(this.injectedOutputPath, `${key}=${stringValue}\n`, { encoding: 'utf8' });
  }
}