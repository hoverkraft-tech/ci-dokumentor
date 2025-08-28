import type { LoggerAdapter } from './logger.adapter.js';

/**
 * JSON logger adapter for structured output
 */
export class JsonLoggerAdapter implements LoggerAdapter {

  getFormat(): string {
    return 'json';
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    console.error(JSON.stringify({ level: 'debug', message }));
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    console.info(JSON.stringify({ level: 'info', message }));
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.error(JSON.stringify({ level: 'warning', message }));
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(JSON.stringify({ level: 'error', message }));
  }

  /**
   * Log a result message
   */
  result(data: unknown): void {
    console.log({ level: 'result', data });
  }
}