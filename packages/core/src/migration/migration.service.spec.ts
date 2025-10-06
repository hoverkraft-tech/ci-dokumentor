import { describe, beforeEach, it, expect, vi, Mocked } from 'vitest';
import { FormatterService } from '../formatter/formatter.service.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from '../renderer/diff-renderer.adapter.js';
import {
  FormatterServiceMockFactory,
  MigrationAdapterMockFactory,
  RendererAdapterMockFactory,
} from '../../__tests__/index.js';
import { MigrationAdapter } from './migration.adapter.js';
import { MigrationService } from './migration.service.js';

describe('MigrationService', () => {
  let service: MigrationService;
  let adapter: Mocked<MigrationAdapter>;
  let mockFormatterService: FormatterService;
  let mockFileRenderer: Mocked<FileRendererAdapter>;
  let mockDiffRenderer: Mocked<DiffRendererAdapter>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = MigrationAdapterMockFactory.create({
      getName: 'test-tool',
      supportsDestination: true,
    });

    // Create proper mocks using mock factories
    mockFormatterService = FormatterServiceMockFactory.create();
    mockFileRenderer = RendererAdapterMockFactory.create() as Mocked<FileRendererAdapter>;
    mockDiffRenderer = RendererAdapterMockFactory.create() as Mocked<DiffRendererAdapter>;

    service = new MigrationService(
      mockFormatterService,
      (dryRun: boolean) => dryRun ? mockDiffRenderer : mockFileRenderer,
      [adapter]
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided adapters', () => {
      const availableTools = service.getSupportedTools();
      expect(availableTools).toContain('test-tool');
    });

    it('should work with empty adapter array', () => {
      const emptyService = new MigrationService(
        mockFormatterService,
        (dryRun: boolean) => dryRun ? mockDiffRenderer : mockFileRenderer,
        []
      );
      expect(emptyService.getSupportedTools()).toEqual([]);
    });
  });

  describe('getAvailableTools', () => {
    it('should return list of registered tools', () => {
      const availableTools = service.getSupportedTools();
      expect(availableTools).toEqual(['test-tool']);
    });
  });
});