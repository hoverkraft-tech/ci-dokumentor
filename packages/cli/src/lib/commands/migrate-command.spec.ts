import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { MigrateCommand } from './migrate-command.js';
import { MigrateDocumentationUseCase } from '../usecases/migrate-documentation.usecase.js';
import { MigrationService } from '@ci-dokumentor/core';

describe('MigrateCommand', () => {
  let command: MigrateCommand;
  let mockMigrateDocumentationUseCase: Mocked<MigrateDocumentationUseCase>;
  let mockMigrationService: Mocked<MigrationService>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockMigrateDocumentationUseCase = {
      execute: vi.fn(),
      getSupportedTools: vi.fn(),
    } as Partial<MigrateDocumentationUseCase> as Mocked<MigrateDocumentationUseCase>;

    mockMigrationService = {
      getSupportedTools: vi.fn().mockReturnValue(['action-docs', 'auto-doc', 'actdocs', 'github-action-readme-generator']),
      migrate: vi.fn(),
      autoMigrate: vi.fn(),
    } as Partial<MigrationService> as Mocked<MigrationService>;

    command = new MigrateCommand(mockMigrateDocumentationUseCase, mockMigrationService);
  });

  describe('configure', () => {
    it('should configure command with correct name and description', () => {
      const configuredCommand = command.configure();

      expect(configuredCommand.name()).toBe('migrate');
      expect(configuredCommand.description()).toBe('Migrate existing documentation markers from various tools to ci-dokumentor format');
    });

    it('should set up required options correctly', () => {
      const configuredCommand = command.configure();
      const options = configuredCommand.options;

      const toolOption = options.find(opt => opt.flags === '-t, --tool <tool>');
      expect(toolOption).toBeDefined();
      expect(toolOption?.required).toBe(true);

      const destinationOption = options.find(opt => opt.flags === '-d, --destination <file>');
      expect(destinationOption).toBeDefined();
      expect(destinationOption?.required).toBe(true);

      const dryRunOption = options.find(opt => opt.flags === '--dry-run');
      expect(dryRunOption).toBeDefined();
      expect(dryRunOption?.required).toBe(false);
    });

    it('should list available tools in tool option description', () => {
      const configuredCommand = command.configure();
      const options = configuredCommand.options;

      const toolOption = options.find(opt => opt.flags === '-t, --tool <tool>');
      expect(toolOption?.description).toContain('action-docs');
      expect(toolOption?.description).toContain('auto-doc');
      expect(toolOption?.description).toContain('actdocs');
      expect(toolOption?.description).toContain('github-action-readme-generator');
    });
  });
});