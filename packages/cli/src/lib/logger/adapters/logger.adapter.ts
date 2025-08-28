export const LOGGER_ADAPTER_IDENTIFIER = Symbol('LoggerAdapter');

/**
 * Logger interface for abstracting logging operations with format-aware output
 */
export interface LoggerAdapter {

  /**
   * Get the output format supported by this adapter
   */
  getFormat(): string;

  /**
   * Log a debug message
   */
  debug(message: string): void;

  /**
   * Log an info message
   */
  info(message: string): void;

  /**
   * Log a warning message
   */
  warn(message: string): void;

  /**
   * Log an error message
   */
  error(message: string): void;

  /**
   * Log a result message
   */
  result(data: unknown): void;
}
