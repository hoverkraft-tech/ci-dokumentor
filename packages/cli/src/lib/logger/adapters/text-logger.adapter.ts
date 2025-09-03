import { injectable } from 'inversify';
import type { LoggerAdapter } from './logger.adapter.js';

/**
 * Text logger adapter for console output with emojis and formatting
 */
@injectable()
export class TextLoggerAdapter implements LoggerAdapter {
  getFormat(): string {
    return 'text';
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    console.debug(`🐛 ${message}`);
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    console.info(message);
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.warn(`⚠ ${message}`);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (message.trim().length > 0) {
      console.error(`❌ ${message}`);
    } else {
      console.error(message);
    }
  }

  /**
   * Log a result message
   */
  result(data: unknown): void {
    if (typeof data === 'object' && data !== null) {
      console.log(`✅ Result:\n${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`✅ Result: ${data}`);
    }
  }
}