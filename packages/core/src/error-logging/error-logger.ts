/**
 * Error logging utilities for CI test reporting
 */
export interface ErrorContext {
  testFile?: string;
  testName?: string;
  stackTrace?: string;
  timestamp?: string;
  package?: string;
  command?: string;
  errorType?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface FormattedError {
  message: string;
  context: ErrorContext;
  formatted: string;
}

export class ErrorLogger {
  private static errors: FormattedError[] = [];

  /**
   * Log an error with context information
   */
  static logError(error: Error, context: ErrorContext = {}): FormattedError {
    const formattedError: FormattedError = {
      message: error.message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        stackTrace: error.stack,
        errorType: error.name,
      },
      formatted: this.formatError(error, context),
    };

    this.errors.push(formattedError);
    return formattedError;
  }

  /**
   * Get all logged errors
   */
  static getErrors(): FormattedError[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Format an error for display
   */
  private static formatError(error: Error, context: ErrorContext): string {
    const lines = [
      `❌ Error: ${error.message}`,
      `📁 Package: ${context.package || 'unknown'}`,
      `🔧 Command: ${context.command || 'unknown'}`,
    ];

    if (context.testFile) {
      lines.push(`📄 Test File: ${context.testFile}`);
    }

    if (context.testName) {
      lines.push(`🧪 Test Name: ${context.testName}`);
    }

    if (context.timestamp) {
      lines.push(`🕒 Timestamp: ${context.timestamp}`);
    }

    if (error.stack) {
      lines.push(`📋 Stack Trace:`);
      lines.push(error.stack);
    }

    if (context.additionalInfo) {
      lines.push(`ℹ️  Additional Info:`);
      lines.push(JSON.stringify(context.additionalInfo, null, 2));
    }

    return lines.join('\n');
  }

  /**
   * Generate a summary report of all errors
   */
  static generateErrorReport(): string {
    if (this.errors.length === 0) {
      return '✅ No errors logged';
    }

    const header = `🚨 Error Summary Report (${this.errors.length} errors)`;
    const separator = '='.repeat(header.length);
    
    const errorsByPackage = this.errors.reduce((acc, error) => {
      const pkg = error.context.package || 'unknown';
      if (!acc[pkg]) {
        acc[pkg] = [];
      }
      acc[pkg].push(error);
      return acc;
    }, {} as Record<string, FormattedError[]>);

    const sections = Object.entries(errorsByPackage).map(([pkg, errors]) => {
      const packageHeader = `📦 Package: ${pkg} (${errors.length} errors)`;
      const errorList = errors.map((error, index) => {
        const errorHeader = `  ${index + 1}. ${error.message}`;
        const errorDetails = error.formatted
          .split('\n')
          .slice(1) // Skip the first line (message) since it's in the header
          .map(line => `     ${line}`)
          .join('\n');
        return `${errorHeader}\n${errorDetails}`;
      }).join('\n\n');
      
      return `${packageHeader}\n${errorList}`;
    }).join('\n\n');

    return `${header}\n${separator}\n\n${sections}`;
  }
}