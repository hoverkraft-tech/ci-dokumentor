import { inject, injectable } from 'inversify';
import { FileReaderAdapter, ConcurrencyService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

/**
 * Base input interface for multi-file use cases
 */
export type MultiFileUseCaseInput = {
  outputFormat: string | undefined;
  dryRun: boolean;
  concurrency?: number;
}

type MultiFileExecutionContext = {
  files: string[];
  isMultiFile: boolean;
  concurrency: number;
};

export type FileResult = {
  success: boolean;
  destination?: string;
  data?: string;
  error?: string;
};

/**
 * Base output interface for multi-file use cases
 */
export type MultiFileUseCaseOutput<Result extends FileResult = FileResult> = FileResult & {
  results: Result[];
}

/**
 * Abstract base class for use cases that process multiple files concurrently
 * Provides common functionality for file resolution, concurrent execution, and result handling
 */
@injectable()
export abstract class AbstractMultiFileUseCase<Result extends FileResult = FileResult> {
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
   * Prepare shared execution context for single or multi-file operations
   */
  protected initializeExecutionContext(
    operation: string,
    input: MultiFileUseCaseInput,
    files: string[]
  ): MultiFileExecutionContext {
    const fileList = [...files];
    const isMultiFile = fileList.length > 1;

    if (isMultiFile) {
      this.logMultiFileExecutionStart(
        operation,
        fileList.length,
        input.dryRun,
        input.outputFormat
      );
    }

    return {
      files: fileList,
      isMultiFile,
      concurrency: input.concurrency ?? AbstractMultiFileUseCase.DEFAULT_CONCURRENCY,
    } satisfies MultiFileExecutionContext;
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

  protected async processFilesConcurrently(
    input: MultiFileUseCaseInput,
    executionContext: MultiFileExecutionContext,
  ) {
    const results = await this.executeConcurrently(
      executionContext.files.map((file: string) => () =>
        this.processFile({ ...input, file })
      ),
      executionContext.concurrency
    );

    const fileResults = this.collectFileResults(
      results,
      executionContext.files,
    );

    this.validateFileResults(
      fileResults,
      executionContext.files,
    );

    const output = {
      success: fileResults.every(result => result.success),
      destination: this.buildDestinationSummary(fileResults),
      data: this.buildDataSummary(fileResults),
      results: fileResults,
    };

    this.finalizeExecution(output, executionContext, input.outputFormat);

    return output;
  }

  /**
   * Execute tasks concurrently with controlled parallelism
   */
  private async executeConcurrently(
    tasks: Array<() => Promise<Result>>,
    concurrency: number
  ): Promise<PromiseSettledResult<Result>[]> {
    return this.concurrencyService.executeWithLimit(tasks, concurrency);
  }

  protected abstract processFile(
    input: MultiFileUseCaseInput & { file: string }
  ): Promise<Result>;

  /**
   * Log successful multi-file processing completion
   */
  private logMultiFileExecutionSuccess(
    fileCount: number,
    outputFormat: string | undefined
  ): void {
    this.loggerService.info(
      `Successfully processed ${fileCount} files!`,
      outputFormat
    );
  }

  /**
   * Build destination summary for aggregated outputs
   */
  private buildDestinationSummary(
    fileResults: Result[],
  ): string | undefined {
    if (fileResults.length === 0) {
      throw new Error('No results available.');
    }

    const successfulDestinations = fileResults
      .filter((result) => result.success && result.destination)
      .map((result) => result.destination as string);

    if (successfulDestinations.length === 0) {
      return undefined;
    }

    const uniqueDestinations = Array.from(new Set(successfulDestinations));
    return uniqueDestinations.join('\n');
  }

  private buildDataSummary(
    fileResults: Result[],
  ): string | undefined {
    if (fileResults.length === 0) {
      throw new Error('No results available.');
    }

    const successfulData = fileResults
      .filter((result) => result.success && result.data)
      .map((result) => result.data as string);

    if (successfulData.length === 0) {
      return undefined;
    }

    const uniqueData = Array.from(new Set(successfulData));
    return uniqueData.join('\n');
  }

  /**
   * Finalize execution logging for single or multi-file operations
   */
  private finalizeExecution(
    output: MultiFileUseCaseOutput<Result>,
    context: MultiFileExecutionContext,
    format: string | undefined
  ): void {
    if (context.isMultiFile) {
      this.logMultiFileExecutionSuccess(context.files.length, format);
    }

    this.loggerService.result(output, format);
  }

  /**
   * Collect file processing results from promise settled results
   */
  private collectFileResults(
    results: PromiseSettledResult<Result>[],
    files: string[],
  ): Result[] {

    const resultMapper = (file: string, fileResult: Result) => ({
      ...fileResult,
      success: true,
      destination: fileResult.destination ?? file,

    });
    const errorMapper = (file: string, error: unknown) => ({
      destination: file,
      success: false,
      error: (error as Error)?.message || String(error),
    });

    return results.map((result, index) => {
      const file = files[index];
      if (result.status === 'fulfilled') {
        return resultMapper(file, result.value);
      } else {
        return errorMapper(file, result.reason);
      }
    }) as Result[];
  }

  /**
   * Validate file results and throw if any failed
   */
  private validateFileResults(
    fileResults: Result[],
    files: string[],
  ): void {
    const failures = fileResults.filter(r => !r.success);

    if (failures.length > 0) {
      const errorMessage = this.formatFailureMessages(
        fileResults,
        files,
      );
      throw new Error(errorMessage);
    }
  }

  /**
   * Collect and format error messages from failed results
   */
  private formatFailureMessages(
    fileResults: Result[],
    files: string[],
  ): string {
    const failures = fileResults.filter(r => !r.success);

    if (failures.length === 0) {
      return '';
    }

    const errorMessages = failures.map((failure, index) => {
      const file = files[index];
      return `  - ${file}: ${failure.error}`;
    }).join('\n');

    return `Failed to process ${failures.length} of ${files.length} files:\n${errorMessages}`;
  }
}
