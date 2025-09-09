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
    if (Array.isArray(data)) {
      return this.resultArray(data);
    }
    if (typeof data === 'object' && data !== null) {
      return this.resultObject(data);
    }
    console.info(`✅ Result: ${data}`);
  }

  private resultArray(data: unknown[]): void {
    console.info(`✅ Result:`);
    data.forEach((item) => {
      const stringValue = typeof item === 'string' ? item : JSON.stringify(item);
      console.info(`   - ${stringValue}`);
    });
  }

  private resultObject(data: object): void {
    console.info(`✅ Result:`);
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      console.info(`   - ${key}: ${stringValue}`);
    }
  }
}