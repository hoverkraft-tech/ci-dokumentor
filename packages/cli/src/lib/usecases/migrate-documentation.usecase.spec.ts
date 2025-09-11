import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import mockFs from 'mock-fs';

import { MigrateDocumentationUseCase } from './migrate-documentation.usecase.js';
import { MigrationAdapter, MigrationService } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';
import { LoggerServiceMockFactory } from '../../../__tests__/logger-service-mock.factory.js';

describe('MigrateDocumentationUseCase', () => {
  let migrateDocumentationUseCase: MigrateDocumentationUseCase;
  let mockLoggerService: Mocked<LoggerService>;
  let mockMigrationService: Mocked<MigrationService>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockFs({
      './README.md': 'Content with old markers: <!-- action-docs-inputs source="action.yml" -->',
      './empty.md': '',
    });

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

    migrateDocumentationUseCase = new MigrateDocumentationUseCase(
      mockLoggerService,
      mockMigrationService
    );
  });

  afterEach(() => {
    mockFs.restore();
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
      expect(result.destination).toBe('./README.md');
      expect(result.data).toBe('migration result');
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
      expect(result.data).toBe('migration result');
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

      expect(result.data).toBe('');
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Documentation migrated in: ./README.md',
        'text'
      );
    });
  });
});