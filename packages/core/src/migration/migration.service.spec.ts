import { describe, beforeEach, it, expect, vi, Mocked } from 'vitest';
import { MigrationService } from './migration.service.js';
import { MigrationAdapter } from './migration.adapter.js';
import { FormatterService } from '../formatter/formatter.service.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from '../renderer/diff-renderer.adapter.js';
import { RendererService } from '../renderer/renderer.service.js';
import {
  FormatterServiceMockFactory,
  MigrationAdapterMockFactory,
  RendererAdapterMockFactory,
  RendererServiceMockFactory,
} from '../../__tests__/index.js';

describe('MigrationService', () => {
  let service: MigrationService;
  let adapter: Mocked<MigrationAdapter>;
  let mockFormatterService: FormatterService;
  let mockFileRenderer: Mocked<FileRendererAdapter>;
  let mockDiffRenderer: Mocked<DiffRendererAdapter>;
  let mockRendererService: Mocked<RendererService>;

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
    mockRendererService = RendererServiceMockFactory.create();

    service = new MigrationService(
      mockFormatterService,
      mockFileRenderer,
      mockDiffRenderer,
      mockRendererService,
      [adapter]
    );
  });

  describe('constructor', () => {
    it('should initialize with provided adapters', () => {
      const availableTools = service.getSupportedTools();
      expect(availableTools).toContain('test-tool');
    });

    it('should work with empty adapter array', () => {
      const emptyService = new MigrationService(
        mockFormatterService,
        mockFileRenderer,
        mockDiffRenderer,
        mockRendererService,
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