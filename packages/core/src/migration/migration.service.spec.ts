import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MigrationService } from './migration.service.js';
import { MigrationAdapter } from './migration.adapter.js';
import { FormatterService } from '../formatter/formatter.service.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from '../renderer/diff-renderer.adapter.js';

class TestMigrationAdapter implements MigrationAdapter {
  getToolName(): string {
    return 'test-tool';
  }

  canMigrate(content: string): boolean {
    return content.includes('<!-- test-marker -->');
  }

  migrate(content: string): string {
    return content.replace(/<!-- test-marker -->/g, '<!-- test:start -->');
  }
}

describe('MigrationService', () => {
  let service: MigrationService;
  let adapter: TestMigrationAdapter;
  let mockFormatterService: FormatterService;
  let mockFileRenderer: FileRendererAdapter;
  let mockDiffRenderer: DiffRendererAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new TestMigrationAdapter();
    
    // Create minimal mocks
    mockFormatterService = {} as FormatterService;
    mockFileRenderer = {} as FileRendererAdapter;
    mockDiffRenderer = {} as DiffRendererAdapter;
    
    service = new MigrationService(
      mockFormatterService,
      mockFileRenderer,
      mockDiffRenderer,
      [adapter]
    );
  });

  describe('constructor', () => {
    it('should initialize with provided adapters', () => {
      const availableTools = service.getAvailableTools();
      expect(availableTools).toContain('test-tool');
    });

    it('should work with empty adapter array', () => {
      const emptyService = new MigrationService(
        mockFormatterService,
        mockFileRenderer,
        mockDiffRenderer,
        []
      );
      expect(emptyService.getAvailableTools()).toEqual([]);
    });
  });

  describe('getAvailableTools', () => {
    it('should return list of registered tools', () => {
      const availableTools = service.getAvailableTools();
      expect(availableTools).toEqual(['test-tool']);
    });
  });

  describe('migrate', () => {
    it('should migrate content using specified adapter', () => {
      const content = '<!-- test-marker -->\nSome content\n<!-- test-marker -->';
      const result = service.migrate('test-tool', content);
      expect(result).toBe('<!-- test:start -->\nSome content\n<!-- test:start -->');
    });

    it('should throw error for unknown tool', () => {
      const content = 'Some content';
      expect(() => service.migrate('unknown-tool', content)).toThrow('Migration adapter for tool \'unknown-tool\' not found');
    });

    it('should throw error if content is not compatible', () => {
      const content = 'Some content without markers';
      expect(() => service.migrate('test-tool', content)).toThrow('Content does not contain markers compatible with test-tool');
    });
  });

  describe('autoMigrate', () => {
    it('should auto-detect and migrate compatible content', () => {
      const content = '<!-- test-marker -->\nSome content';
      const result = service.autoMigrate(content);
      
      expect(result).toBeTruthy();
      expect(result?.tool).toBe('test-tool');
      expect(result?.migratedContent).toBe('<!-- test:start -->\nSome content');
    });

    it('should return null for incompatible content', () => {
      const content = 'Some content without any markers';
      const result = service.autoMigrate(content);
      expect(result).toBeNull();
    });
  });
});