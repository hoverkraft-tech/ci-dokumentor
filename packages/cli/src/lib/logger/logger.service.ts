import { injectable, multiInject } from 'inversify';
import { LOGGER_ADAPTER_IDENTIFIER  } from './adapters/logger.adapter.js';
import type {LoggerAdapter} from './adapters/logger.adapter.js';
/**
 * Logger service that manages different logger adapters based on output format
 */
@injectable()
export class LoggerService {
  constructor(
    @multiInject(LOGGER_ADAPTER_IDENTIFIER) private readonly loggerAdapters: LoggerAdapter[]
  ) { }

  /**
   * Get all supported output formats
   */
  getSupportedFormats(): string[] {
    return this.loggerAdapters.map(adapter => adapter.getFormat());
  }

  /**
 * Log a debug message
 */
  debug(message: string, format: string | undefined): void {
    this.getLogger(format).debug(message);
  }

  /**
   * Log an info message
   */
  info(message: string, format: string | undefined): void {
    this.getLogger(format).info(message);
  }

  /**
   * Log a warning message
   */
  warn(message: string, format: string | undefined): void {
    this.getLogger(format).warn(message);
  }

  /**
   * Log an error message
   */
  error(message: string, format: string | undefined): void {
    this.getLogger(format).error(message);
  }

  /**
   * Log a result message
   */
  result(data: unknown, format: string | undefined): void {
    this.getLogger(format).result(data);
  }

  /**
   * Get the appropriate logger adapter for the given format.
   * If no format is specified, the default logger adapter is returned.
   */
  private getLogger(format: string | undefined): LoggerAdapter {
    if (format === undefined) {
      if (this.loggerAdapters.length === 0) {
        throw new Error('No logger adapters are configured');
      }
      return this.loggerAdapters[0];
    }

    const logger = this.loggerAdapters.find(adapter => adapter.getFormat() === format);
    if (!logger) {
      throw new Error(`Unsupported output format: ${format}`);
    }
    return logger;
  }

}