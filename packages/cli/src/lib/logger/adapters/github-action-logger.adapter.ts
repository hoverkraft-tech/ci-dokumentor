import type { LoggerAdapter } from './logger.adapter.js';

/**
 * GitHub Action logger adapter using workflow commands
 */
export class GitHubActionLoggerAdapter implements LoggerAdapter {

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
    if (typeof data === 'object' && data !== null) {
      // Output GitHub Actions workflow commands for object data
      for (const [key, value] of Object.entries(data)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        console.log(`::set-output name=${key}::${stringValue}`);
      }
    } else {
      console.log(`::set-output name=result::${data}`);
    }
  }
}