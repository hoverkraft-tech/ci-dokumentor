import { ErrorLogger, ErrorContext } from './error-logger.js';

/**
 * Test execution wrapper that captures errors with context
 */
export class TestErrorCapture {
  /**
   * Wrap a test function with error logging
   */
  static async withErrorLogging<T>(
    testFn: () => Promise<T> | T,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    try {
      return await testFn();
    } catch (error) {
      if (error instanceof Error) {
        ErrorLogger.logError(error, context);
      }
      throw error; // Re-throw to maintain test failure behavior
    }
  }

  /**
   * Wrap a synchronous test function with error logging
   */
  static withErrorLoggingSync<T>(
    testFn: () => T,
    context: Partial<ErrorContext> = {}
  ): T {
    try {
      return testFn();
    } catch (error) {
      if (error instanceof Error) {
        ErrorLogger.logError(error, context);
      }
      throw error; // Re-throw to maintain test failure behavior
    }
  }

  /**
   * Create a test context for a specific test file
   */
  static createTestContext(testFile: string, packageName: string): Partial<ErrorContext> {
    return {
      testFile,
      package: packageName,
      command: 'vitest',
    };
  }
}

/**
 * Helper function to get package name from import.meta.url
 */
export function getPackageNameFromUrl(url: string): string {
  const match = url.match(/packages\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}

/**
 * Helper function to create a test wrapper for a specific file
 */
export function createTestWrapper(testFile: string, packageName: string) {
  const context = TestErrorCapture.createTestContext(testFile, packageName);
  
  return {
    async withErrorLogging<T>(testFn: () => Promise<T> | T, testName?: string): Promise<T> {
      return TestErrorCapture.withErrorLogging(testFn, { ...context, testName });
    },
    
    withErrorLoggingSync<T>(testFn: () => T, testName?: string): T {
      return TestErrorCapture.withErrorLoggingSync(testFn, { ...context, testName });
    },
  };
}