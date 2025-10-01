import { inject, injectable } from 'inversify';
import { FileReaderAdapter, ConcurrencyService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

/**
 * Abstract base class for use cases that process multiple files concurrently
 * Provides common functionality for file resolution and concurrent execution
 */
@injectable()
export abstract class AbstractMultiFileUseCase {
  constructor(
    @inject(LoggerService) protected readonly loggerService: LoggerService,
    @inject(FileReaderAdapter) protected readonly readerAdapter: ReaderAdapter,
    @inject(ConcurrencyService) protected readonly concurrencyService: ConcurrencyService
  ) { }

  /**
   * Resolve files from patterns using ReaderAdapter
   */
  protected async resolveFiles(patterns: string | string[]): Promise<string[]> {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    const resolvedFiles = new Set<string>();

    for (const pattern of patternArray) {
      const files = await this.readerAdapter.findResources(pattern);
      files.forEach(file => resolvedFiles.add(file));
    }

    return Array.from(resolvedFiles).sort();
  }

  /**
   * Execute tasks concurrently with controlled parallelism
   */
  protected async executeConcurrently<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<PromiseSettledResult<T>[]> {
    return this.concurrencyService.executeWithLimit(tasks, concurrency);
  }

  /**
   * Collect and format error messages from failed results
   */
  protected formatFailureMessages<T extends { success: boolean; error?: string }>(
    results: T[],
    fileGetter: (result: T, index: number) => string,
    totalCount: number
  ): string {
    const failures = results.filter(r => !r.success);
    
    if (failures.length === 0) {
      return '';
    }

    const errorMessages = failures.map((f) => {
      const index = results.indexOf(f);
      const file = fileGetter(f, index);
      return `  - ${file}: ${f.error}`;
    }).join('\n');

    return `Failed to process ${failures.length} of ${totalCount} files:\n${errorMessages}`;
  }
}
