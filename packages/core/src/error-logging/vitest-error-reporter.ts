import { ErrorLogger } from './error-logger.js';
import type { File, Reporter } from 'vitest';

/**
 * Custom Vitest reporter that integrates with our error logging system
 */
export class ErrorReporter implements Reporter {
  onInit() {
    // Clear any existing errors when starting new test run
    ErrorLogger.clearErrors();
  }

  onFinished(files: File[] = []) {
    // Process all files to find failed tests
    for (const file of files) {
      this.processFile(file);
    }

    // Generate and display error report at the end
    const errorReport = ErrorLogger.generateErrorReport();
    console.log('\n' + '='.repeat(80));
    console.log(errorReport);
    console.log('='.repeat(80) + '\n');
  }

  private processFile(file: File) {
    const packageName = this.getPackageName(file.filepath);
    this.processTask(file, packageName);
  }

  private processTask(task: any, packageName: string) {
    if (task.result?.state === 'fail' && task.result?.errors) {
      for (const error of task.result.errors) {
        ErrorLogger.logError(error, {
          testFile: task.file?.filepath || 'unknown',
          testName: task.name,
          package: packageName,
          command: 'vitest',
          additionalInfo: {
            duration: task.result?.duration,
            retry: task.retry,
          },
        });
      }
    }

    // Process child tasks recursively
    if (task.tasks) {
      for (const childTask of task.tasks) {
        this.processTask(childTask, packageName);
      }
    }
  }

  private getPackageName(filepath: string): string {
    // Extract package name from filepath
    const match = filepath.match(/packages\/([^/]+)\//);
    return match ? match[1] : 'unknown';
  }
}