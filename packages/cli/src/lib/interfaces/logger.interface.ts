export const LOGGER_IDENTIFIER = Symbol('Logger');

/**
 * Logger interface for abstracting logging operations
 */
export interface Logger {
  /**
   * Log a message
   */
  log(message: string): void;

  /**
   * Log an error message
   */
  error(message: string): void;

  /**
   * Log an info message
   */
  info(message: string): void;

  /**
   * Log a warning message
   */
  warn(message: string): void;

  /**
   * Log a debug message
   */
  debug(message: string): void;
}
