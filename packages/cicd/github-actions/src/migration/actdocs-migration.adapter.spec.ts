import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ActdocsMigrationAdapter } from './actdocs-migration.adapter.js';
import { SectionMappingService } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';

describe('ActdocsMigrationAdapter', () => {
  let adapter: ActdocsMigrationAdapter;
  let sectionMappingService: SectionMappingService;
  let mockFormatterAdapter: FormatterAdapter;

  beforeEach(() => {
    // Create a mock FormatterAdapter that behaves like MarkdownFormatterAdapter.comment()
    mockFormatterAdapter = {
      comment: vi.fn((input: Buffer) => Buffer.from(`<!-- ${input.toString()} -->\n`)),
    } as any;
    
    sectionMappingService = new SectionMappingService(mockFormatterAdapter);
    adapter = new ActdocsMigrationAdapter(sectionMappingService);
  });

  describe('getToolName', () => {
    it('should return actdocs', () => {
      expect(adapter.getToolName()).toBe('actdocs');
    });
  });

  describe('canMigrate', () => {
    it('should detect actdocs start markers', () => {
      const content = '<!-- actdocs inputs start -->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should detect actdocs end markers', () => {
      const content = '<!-- actdocs inputs end -->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should detect actdocs markers with different spacing', () => {
      const content = '<!--actdocs description start-->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should not detect non-actdocs content', () => {
      const content = 'Regular markdown content';
      expect(adapter.canMigrate(content)).toBe(false);
    });
  });

  describe('migrate', () => {
    it('should migrate actdocs inputs markers', () => {
      const content = `<!-- actdocs inputs start -->
Input details here
<!-- actdocs inputs end -->`;

      const result = adapter.migrate(content);
      
      expect(result).toBe(`<!-- inputs:start -->
Input details here
<!-- inputs:end -->`);
    });

    it('should migrate multiple sections', () => {
      const content = `<!-- actdocs description start -->
Action description
<!-- actdocs description end -->

<!-- actdocs inputs start -->
Input details
<!-- actdocs inputs end -->

<!-- actdocs outputs start -->
Output details
<!-- actdocs outputs end -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- overview:start -->'); // description maps to overview
      expect(result).toContain('<!-- overview:end -->');
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).toContain('<!-- inputs:end -->');
      expect(result).toContain('<!-- outputs:start -->');
      expect(result).toContain('<!-- outputs:end -->');
      expect(result).not.toContain('actdocs');
    });

    it('should handle case insensitive matching', () => {
      const content = '<!-- ACTDOCS SECRETS START -->\n<!-- ACTDOCS SECRETS END -->';
      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- secrets:start -->');
      expect(result).toContain('<!-- secrets:end -->');
    });
  });
});