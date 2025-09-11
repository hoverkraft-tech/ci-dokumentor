import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AutoDocMigrationAdapter } from './auto-doc-migration.adapter.js';
import { SectionMappingService } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';

describe('AutoDocMigrationAdapter', () => {
  let adapter: AutoDocMigrationAdapter;
  let sectionMappingService: SectionMappingService;
  let mockFormatterAdapter: FormatterAdapter;

  beforeEach(() => {
    // Create a mock FormatterAdapter that behaves like MarkdownFormatterAdapter.comment()
    mockFormatterAdapter = {
      comment: vi.fn((input: Buffer) => Buffer.from(`<!-- ${input.toString()} -->\n`)),
    } as any;
    
    sectionMappingService = new SectionMappingService(mockFormatterAdapter);
    adapter = new AutoDocMigrationAdapter(sectionMappingService);
  });

  describe('getToolName', () => {
    it('should return auto-doc', () => {
      expect(adapter.getToolName()).toBe('auto-doc');
    });
  });

  describe('canMigrate', () => {
    it('should detect auto-doc style headers', () => {
      const content = '## Inputs';
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should detect multiple section headers', () => {
      const content = `
## Inputs
Some input content

## Outputs  
Some output content`;
      expect(adapter.canMigrate(content)).toBe(true);
    });

    it('should not detect non-auto-doc content', () => {
      const content = 'Regular markdown content with # different header';
      expect(adapter.canMigrate(content)).toBe(false);
    });

    it('should not detect wrong level headers', () => {
      const content = '# Inputs'; // should be ##
      expect(adapter.canMigrate(content)).toBe(false);
    });
  });

  describe('migrate', () => {
    it('should migrate simple Inputs section', () => {
      const content = `## Inputs

| Name | Description |
|------|-------------|
| input1 | First input |`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).toContain('<!-- inputs:end -->');
      expect(result).toContain('## Inputs');
      expect(result).toContain('| Name | Description |');
    });

    it('should migrate multiple sections', () => {
      const content = `## Description

This is the action description.

## Inputs

Input details here.

## Outputs

Output details here.`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- overview:start -->'); // description maps to overview
      expect(result).toContain('<!-- overview:end -->');
      expect(result).toContain('<!-- inputs:start -->');
      expect(result).toContain('<!-- inputs:end -->');
      expect(result).toContain('<!-- outputs:start -->');
      expect(result).toContain('<!-- outputs:end -->');
    });

    it('should handle sections at end of content', () => {
      const content = `Some content

## Secrets

Secret content`;

      const result = adapter.migrate(content);
      
      expect(result).toContain('<!-- secrets:start -->');
      expect(result).toContain('<!-- secrets:end -->');
      expect(result).toContain('## Secrets');
      expect(result).toContain('Secret content');
    });
  });
});