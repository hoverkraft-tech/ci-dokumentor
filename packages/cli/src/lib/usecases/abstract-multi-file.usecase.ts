import { inject, injectable } from 'inversify';
import { FileReaderAdapter, ConcurrencyService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

/**
 * Base input interface for multi-file use cases
 */
export interface MultiFileUseCaseInput {
  outputFormat: string | undefined;
  dryRun: boolean;
  concurrency?: number;
}

/**
 * Base output interface for multi-file use cases
 */
export interface MultiFileUseCaseOutput<TResult> {
  success: boolean;
  destination?: string;
  data?: string;
  results?: TResult[];
}

/**
 * Abstract base class for use cases that process multiple files concurrently
 * Provides common functionality for file resolution, concurrent execution, and result handling
 */
@injectable()
export abstract class AbstractMultiFileUseCase {
  protected static readonly DEFAULT_CONCURRENCY = 5;

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
    concurrency = 5
  ): Promise<PromiseSettledResult<T>[]> {
    return this.concurrencyService.executeWithLimit(tasks, concurrency);
  }

  /**
   * Log multi-file execution start with customizable operation name
   */
  protected logMultiFileExecutionStart(
    operation: string,
    fileCount: number,
    dryRun: boolean,
    outputFormat: string | undefined
  ): void {
    const prefix = dryRun ? '[DRY RUN] ' : '';
    this.loggerService.info(
      `${prefix}Starting ${operation} for ${fileCount} files...`,
      outputFormat
    );
  }

  /**
   * Log successful multi-file processing completion
   */
  protected logMultiFileExecutionSuccess(
    fileCount: number,
    outputFormat: string | undefined
  ): void {
    this.loggerService.info(
      `Successfully processed ${fileCount} files!`,
      outputFormat
    );
  }

  /**
   * Create success output with result logging
   */
  protected createSuccessOutput<TOutput extends MultiFileUseCaseOutput<unknown>>(
    destination: string,
    data: string | undefined,
    outputFormat: string | undefined,
    outputFactory: (destination: string, data: string | undefined) => TOutput
  ): TOutput {
    const useCaseOutput = outputFactory(destination, data);
    this.loggerService.result(useCaseOutput, outputFormat);
    return useCaseOutput;
  }

  /**
   * Collect file processing results from promise settled results
   */
  protected collectFileResults<TOutput, TResult>(
    results: PromiseSettledResult<TOutput>[],
    files: string[],
    resultMapper: (file: string, output: TOutput) => TResult,
    errorMapper: (file: string, error: unknown) => TResult
  ): TResult[] {
    return results.map((result, index) => {
      const file = files[index];
      if (result.status === 'fulfilled') {
        return resultMapper(file, result.value);
      } else {
        return errorMapper(file, result.reason);
      }
    });
  }

  /**
   * Validate file results and throw if any failed
   */
  protected validateFileResults<T extends { success: boolean; error?: string }>(
    fileResults: T[],
    files: string[],
    fileGetter: (result: T, index: number) => string
  ): void {
    const failures = fileResults.filter(r => !r.success);
    
    if (failures.length > 0) {
      const errorMessage = this.formatFailureMessages(
        fileResults,
        fileGetter,
        files.length
      );
      throw new Error(errorMessage);
    }
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
