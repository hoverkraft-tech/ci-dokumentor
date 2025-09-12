import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ActionDocsMigrationAdapter } from './action-docs-migration.adapter.js';
import { SectionMappingService } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';

describe('ActionDocsMigrationAdapter', () => {
  let adapter: ActionDocsMigrationAdapter;
  let sectionMappingService: SectionMappingService;
  let mockFormatterAdapter: FormatterAdapter;

  beforeEach(() => {
    // Create a mock FormatterAdapter that behaves like MarkdownFormatterAdapter.comment()
    mockFormatterAdapter = {
      comment: vi.fn((input: Buffer) => Buffer.from(`<!-- ${input.toString()} -->\n`)),
    } as any;
    
    sectionMappingService = new SectionMappingService(mockFormatterAdapter);
    adapter = new ActionDocsMigrationAdapter(sectionMappingService);
  });

  describe('getToolName', () => {
    it('should return action-docs', () => {
      expect(adapter.getToolName()).toBe('action-docs');
    });
  });

  describe('canMigrate', () => {
    it('should detect action-docs markers', () => {
      const content = '<!-- action-docs-inputs source="action.yml" -->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should detect action-docs markers with different spacing', () => {
      const content = '<!--action-docs-header source="action.yml"-->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should not detect non-action-docs content', () => {
      const content = 'Regular markdown content';
      expect(adapter.canMigrate(content)).toBe(false);
    });
  });

  describe('migrate', () => {
    it('should migrate action-docs-inputs marker', () => {
      const content = `# My Action

<!-- action-docs-inputs source="action.yml" -->

Some existing content here`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).not.toContain('<!-- inputs:end -->');
      expect(result).not.toContain('action-docs-inputs');
    });

    it('should migrate multiple markers', () => {
      const content = `<!-- action-docs-header source="action.yml" -->
<!-- action-docs-description source="action.yml" -->
<!-- action-docs-inputs source="action.yml" -->
<!-- action-docs-outputs source="action.yml" -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- header:start -->');
      expect(result).toContain('<!-- overview:start -->'); // description maps to overview
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).toContain('<!-- outputs:start -->');
      expect(result).not.toContain('<!-- header:end -->');
      expect(result).not.toContain('<!-- overview:end -->');
      expect(result).not.toContain('<!-- inputs:end -->');
      expect(result).not.toContain('<!-- outputs:end -->');
    });

    it('should migrate action-docs-runs to usage', () => {
      const content = '<!-- action-docs-runs source="action.yml" -->';
      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- usage:start -->');
      expect(result).not.toContain('<!-- usage:end -->');
    });
  });
});