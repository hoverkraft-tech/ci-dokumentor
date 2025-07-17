import { beforeEach, afterEach } from 'vitest';
import { ErrorLogger } from './error-logger.js';

// Clear errors before each test to ensure clean state
beforeEach(() => {
  ErrorLogger.clearErrors();
});

// Optional: Log any uncaught errors during test execution
afterEach(() => {
  // Could add additional cleanup here if needed
});

// Global error handler for uncaught errors
process.on('uncaughtException', (error) => {
  ErrorLogger.logError(error, {
    errorType: 'UncaughtException',
    command: 'vitest',
    additionalInfo: {
      source: 'global_error_handler',
    },
  });
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  ErrorLogger.logError(error, {
    errorType: 'UnhandledRejection',
    command: 'vitest',
    additionalInfo: {
      source: 'global_error_handler',
    },
  });
});