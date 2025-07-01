import { injectable } from 'inversify';
import type { Logger } from '../interfaces/logger.interface.js';

/**
 * Console logger implementation
 * Provides structured logging with different levels and formatting
 */
@injectable()
export class ConsoleLogger implements Logger {

    /**
     * Log a message
     */
    log(message: string): void {
        console.log(message);
    }

    /**
     * Log an error message
     */
    error(message: string): void {
        console.error(message);
    }

    /**
     * Log an info message
     */
    info(message: string): void {
        console.info(`ℹ ${message}`);
    }

    /**
     * Log a warning message
     */
    warn(message: string): void {
        console.warn(`⚠ ${message}`);
    }

    /**
     * Log a debug message
     */
    debug(message: string): void {
        console.debug(`🐛 ${message}`);
    }
}
