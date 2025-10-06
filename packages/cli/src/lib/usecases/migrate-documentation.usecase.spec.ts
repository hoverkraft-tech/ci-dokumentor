import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { MigrationAdapter, MigrationService, ReaderAdapter } from '@ci-dokumentor/core';
import type { ConcurrencyService } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory } from '@ci-dokumentor/core/tests';
import { LoggerService } from '../logger/logger.service.js';
import { LoggerServiceMockFactory } from '../../../__tests__/logger-service-mock.factory.js';
import { MigrateDocumentationUseCase } from './migrate-documentation.usecase.js';

describe('MigrateDocumentationUseCase', () => {
  let migrateDocumentationUseCase: MigrateDocumentationUseCase;
  let mockLoggerService: Mocked<LoggerService>;
  let mockMigrationService: Mocked<MigrationService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  beforeEach(() => {
    vi.resetAllMocks();

    const migrationAdapter = {
      getName: vi.fn().mockReturnValue('action-docs'),
      supportsDestination: vi.fn().mockReturnValue(true),
      migrateDocumentation: vi.fn().mockResolvedValue(undefined),
    } as Mocked<MigrationAdapter>;

    mockLoggerService = LoggerServiceMockFactory.create();
    mockMigrationService = {
      getSupportedTools: vi.fn().mockReturnValue(['action-docs', 'auto-doc']) as Mocked<MigrationService>['getSupportedTools'],
      getMigrationAdapterByTool: vi.fn().mockReturnValue(migrationAdapter) as Mocked<MigrationService>['getMigrationAdapterByTool'],
      autoDetectMigrationAdapter: vi.fn().mockReturnValue(undefined) as Mocked<MigrationService>['autoDetectMigrationAdapter'],
      migrateDocumentationFromTool: vi.fn().mockResolvedValue({
        destination: './README.md',
        data: 'migration result'
      }) as Mocked<MigrationService>['migrateDocumentationFromTool'],
    } as Mocked<MigrationService>;
    mockReaderAdapter = ReaderAdapterMockFactory.create();

    mockReaderAdapter.resourceExists.mockImplementation((path: string) => {
      return path === './README.md';
    });

    const mockConcurrencyService = {
      executeWithLimit: vi.fn().mockImplementation(async <T>(tasks: Array<() => Promise<T>>) => {
        return Promise.allSettled(tasks.map(task => task()));
      }),
    } satisfies Pick<ConcurrencyService, 'executeWithLimit'>;

    migrateDocumentationUseCase = new MigrateDocumentationUseCase(
      mockLoggerService,
      mockMigrationService,
      mockReaderAdapter,
      mockConcurrencyService as ConcurrencyService
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvailableTools', () => {
    it('should return available migration tools', () => {
      const tools = migrateDocumentationUseCase.getSupportedTools();

      expect(mockMigrationService.getSupportedTools).toHaveBeenCalled();
      expect(tools).toEqual(['action-docs', 'auto-doc']);
    });
  });

  describe('execute', () => {
    it('should successfully migrate documentation', async () => {
      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: false
      };

      const result = await migrateDocumentationUseCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data).toBe('migration result');
      expect(result.destination).toBe('./README.md');
      expect(result.results).toEqual([
        {
          data: 'migration result',
          destination: './README.md',
          success: true,
        },
      ]);
      expect(mockMigrationService.migrateDocumentationFromTool).toHaveBeenCalledWith({
        destination: './README.md',
        migrationAdapter: mockMigrationService.getMigrationAdapterByTool('action-docs'),
        dryRun: false
      });
    });

    it('should handle dry-run mode', async () => {
      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: true
      };

      const result = await migrateDocumentationUseCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.destination).toBe('./README.md');
      expect(result.data).toBe('migration result');
      expect(result.results).toEqual([
        {
          data: 'migration result',
          destination: './README.md',
          success: true,
        },
      ]);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('[DRY RUN]'),
        'text'
      );
    });

    it('should throw error for non-existent destination file', async () => {
      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './non-existent.md',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Destination file does not exist or is not a file: ./non-existent.md'
      );
    });

    it('should throw error for invalid migration tool', async () => {
      const input = {
        outputFormat: 'text',
        tool: 'invalid-tool',
        destination: './README.md',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Invalid migration tool \'invalid-tool\'. Available tools: action-docs, auto-doc'
      );
    });

    it('should throw error for missing tool', async () => {
      const input = {
        outputFormat: 'text',
        tool: '',
        destination: './README.md',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Migration tool could not be auto-detected. Please specify one using --tool option.'
      );
    });

    it('should throw error for missing destination', async () => {
      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: '',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Destination file is required'
      );
    });

    it('should handle migration service errors', async () => {
      mockMigrationService.migrateDocumentationFromTool.mockRejectedValue(
        new Error('Migration adapter error')
      );

      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Migration adapter error'
      );
    });

    it('should detect no changes needed', async () => {
      mockMigrationService.migrateDocumentationFromTool.mockResolvedValue({
        destination: './README.md',
        data: ''
      });

      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: false
      };

      const result = await migrateDocumentationUseCase.execute(input);

      expect(result.destination).toBe('./README.md');
      expect(result.data).toBeUndefined();
      expect(result.results).toEqual([
        {
          data: '',
          destination: './README.md',
          success: true,
        },
      ]);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Documentation migrated in: ./README.md',
        'text'
      );
    });
  });
});