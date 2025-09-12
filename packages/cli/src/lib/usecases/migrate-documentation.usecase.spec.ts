import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import mockFs from 'mock-fs';

import { MigrateDocumentationUseCase } from './migrate-documentation.usecase.js';
import { MigrationService } from '@ci-dokumentor/core';
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

    mockLoggerService = LoggerServiceMockFactory.create();
    mockMigrationService = {
      getAvailableTools: vi.fn().mockReturnValue(['action-docs', 'auto-doc']),
      migrate: vi.fn().mockReturnValue('Content with new markers: <!-- inputs:start -->'),
      autoMigrate: vi.fn(),
      migrateDocumentationForTool: vi.fn().mockResolvedValue({
        destination: './README.md',
        data: 'migration result',
        changes: 1
      })
    } as Partial<MigrationService> as Mocked<MigrationService>;

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
      const tools = migrateDocumentationUseCase.getAvailableTools();
      
      expect(mockMigrationService.getAvailableTools).toHaveBeenCalled();
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
      expect(result.changes).toBe(1);
      expect(mockMigrationService.migrateDocumentationForTool).toHaveBeenCalledWith({
        destination: './README.md',
        toolName: 'action-docs',
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
      expect(result.changes).toBe(1);
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
        'Migration tool is required'
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
      mockMigrationService.migrateDocumentationForTool.mockRejectedValue(
        new Error('Migration adapter error')
      );

      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: false
      };

      await expect(migrateDocumentationUseCase.execute(input)).rejects.toThrow(
        'Migration failed: Migration adapter error'
      );
    });

    it('should detect no changes needed', async () => {
      mockMigrationService.migrateDocumentationForTool.mockResolvedValue({
        destination: './README.md',
        data: 'no changes',
        changes: 0
      });
      
      const input = {
        outputFormat: 'text',
        tool: 'action-docs',
        destination: './README.md',
        dryRun: false
      };

      const result = await migrateDocumentationUseCase.execute(input);

      expect(result.changes).toBe(0);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'No changes needed - content already in ci-dokumentor format',
        'text'
      );
    });
  });
});