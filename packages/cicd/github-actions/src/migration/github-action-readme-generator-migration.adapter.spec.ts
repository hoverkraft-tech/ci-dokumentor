import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GitHubActionReadmeGeneratorMigrationAdapter } from './github-action-readme-generator-migration.adapter.js';
import { SectionMappingService } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';

describe('GitHubActionReadmeGeneratorMigrationAdapter', () => {
  let adapter: GitHubActionReadmeGeneratorMigrationAdapter;
  let sectionMappingService: SectionMappingService;
  let mockFormatterAdapter: FormatterAdapter;

  beforeEach(() => {
    // Create a mock FormatterAdapter that behaves like MarkdownFormatterAdapter.comment()
    mockFormatterAdapter = {
      comment: vi.fn((input: Buffer) => Buffer.from(`<!-- ${input.toString()} -->\n`)),
    } as any;
    
    sectionMappingService = new SectionMappingService(mockFormatterAdapter);
    adapter = new GitHubActionReadmeGeneratorMigrationAdapter(sectionMappingService);
  });

  describe('getToolName', () => {
    it('should return github-action-readme-generator', () => {
      expect(adapter.getToolName()).toBe('github-action-readme-generator');
    });
  });

  describe('canMigrate', () => {
    it('should detect start/end markers', () => {
      const content = '<!-- start inputs -->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should detect end markers', () => {
      const content = '<!-- end outputs -->';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should not detect non-github-action-readme-generator content', () => {
      const content = 'Regular markdown content';
      expect(adapter.canMigrate(content)).toBe(false);
    });
  });

  describe('migrate', () => {
    it('should migrate basic start/end pairs', () => {
      const content = `<!-- start inputs -->
Input content here
<!-- end inputs -->`;

      const result = adapter.migrate(content);
      
      expect(result).toBe(`<!-- inputs:start -->
Input content here
<!-- inputs:end -->`);
    });

    it('should migrate multiple sections', () => {
      const content = `<!-- start title -->
Title content
<!-- end title -->

<!-- start inputs -->
Input content
<!-- end inputs -->

<!-- start outputs -->
Output content
<!-- end outputs -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- header:start -->'); // title maps to header
      expect(result).toContain('<!-- header:end -->');
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).toContain('<!-- inputs:end -->');
      expect(result).toContain('<!-- outputs:start -->');
      expect(result).toContain('<!-- outputs:end -->');
    });

    it('should handle special examples path', () => {
      const content = `<!-- start [.github/ghadocs/examples/] -->
Example content
<!-- end [.github/ghadocs/examples/] -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- examples:start -->');
      expect(result).toContain('<!-- examples:end -->');
      expect(result).toContain('Example content');
    });

    it('should migrate branding to badges section', () => {
      const content = `<!-- start branding -->
Branding content
<!-- end branding -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- badges:start -->'); // branding maps to badges
      expect(result).toContain('<!-- badges:end -->');
    });

    it('should migrate description to overview section', () => {
      const content = `<!-- start description -->
Description content
<!-- end description -->`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- overview:start -->'); // description maps to overview
      expect(result).toContain('<!-- overview:end -->');
    });
  });
});