import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SectionMappingService, ToolSectionMapping } from './section-mapping.service.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import type { FormatterAdapter } from '../formatter/formatter.adapter.js';

describe('SectionMappingService', () => {
  let service: SectionMappingService;
  let mockFormatterAdapter: FormatterAdapter;

  beforeEach(() => {
    // Create a mock FormatterAdapter that behaves like MarkdownFormatterAdapter.comment()
    mockFormatterAdapter = {
      comment: vi.fn((input: Buffer) => Buffer.from(`<!-- ${input.toString()} -->\n`)),
    } as any;
    
    service = new SectionMappingService(mockFormatterAdapter);
  });

  describe('getStartMarker', () => {
    it('should generate correct start marker format', () => {
      const result = service.getStartMarker(SectionIdentifier.Inputs);
      expect(result).toBe('<!-- inputs:start -->');
    });

    it('should generate correct start marker for different sections', () => {
      expect(service.getStartMarker(SectionIdentifier.Header)).toBe('<!-- header:start -->');
      expect(service.getStartMarker(SectionIdentifier.Outputs)).toBe('<!-- outputs:start -->');
      expect(service.getStartMarker(SectionIdentifier.Usage)).toBe('<!-- usage:start -->');
    });
  });

  describe('getEndMarker', () => {
    it('should generate correct end marker format', () => {
      const result = service.getEndMarker(SectionIdentifier.Inputs);
      expect(result).toBe('<!-- inputs:end -->');
    });

    it('should generate correct end marker for different sections', () => {
      expect(service.getEndMarker(SectionIdentifier.Header)).toBe('<!-- header:end -->');
      expect(service.getEndMarker(SectionIdentifier.Outputs)).toBe('<!-- outputs:end -->');
      expect(service.getEndMarker(SectionIdentifier.Usage)).toBe('<!-- usage:end -->');
    });
  });

  describe('getAvailableSections', () => {
    it('should return all section identifiers', () => {
      const sections = service.getAvailableSections();
      expect(sections).toContain(SectionIdentifier.Header);
      expect(sections).toContain(SectionIdentifier.Inputs);
      expect(sections).toContain(SectionIdentifier.Outputs);
      expect(sections).toContain(SectionIdentifier.Usage);
      expect(sections.length).toBeGreaterThan(10); // Should have all sections
    });
  });

  describe('mapToStandardSection', () => {
    let testMapping: ToolSectionMapping;

    beforeEach(() => {
      testMapping = {
        toolName: 'test-tool',
        sectionMappings: {
          'inputs': SectionIdentifier.Inputs,
          'outputs': SectionIdentifier.Outputs,
          'description': SectionIdentifier.Overview,
        },
        patterns: {
          startMarkerPattern: /test/g,
          detectionPattern: /test/,
        },
      };
    });

    it('should map external section names to standard sections', () => {
      expect(service.mapToStandardSection(testMapping, 'inputs')).toBe(SectionIdentifier.Inputs);
      expect(service.mapToStandardSection(testMapping, 'outputs')).toBe(SectionIdentifier.Outputs);
      expect(service.mapToStandardSection(testMapping, 'description')).toBe(SectionIdentifier.Overview);
    });

    it('should handle case-insensitive mapping', () => {
      expect(service.mapToStandardSection(testMapping, 'INPUTS')).toBe(SectionIdentifier.Inputs);
      expect(service.mapToStandardSection(testMapping, 'Outputs')).toBe(SectionIdentifier.Outputs);
      expect(service.mapToStandardSection(testMapping, 'DESCRIPTION')).toBe(SectionIdentifier.Overview);
    });

    it('should handle whitespace in section names', () => {
      expect(service.mapToStandardSection(testMapping, ' inputs ')).toBe(SectionIdentifier.Inputs);
      expect(service.mapToStandardSection(testMapping, '  outputs  ')).toBe(SectionIdentifier.Outputs);
    });

    it('should return null for unmapped section names', () => {
      expect(service.mapToStandardSection(testMapping, 'unknown')).toBeNull();
      expect(service.mapToStandardSection(testMapping, 'secrets')).toBeNull();
    });
  });

  describe('wrapWithMarkers', () => {
    it('should wrap content with start and end markers', () => {
      const content = '## Inputs\nSome input description';
      const result = service.wrapWithMarkers(SectionIdentifier.Inputs, content);
      
      expect(result).toBe('<!-- inputs:start -->\n## Inputs\nSome input description\n<!-- inputs:end -->');
    });

    it('should return only start marker for empty content', () => {
      const result = service.wrapWithMarkers(SectionIdentifier.Inputs, '');
      expect(result).toBe('<!-- inputs:start -->');
    });

    it('should return only start marker for whitespace-only content', () => {
      const result = service.wrapWithMarkers(SectionIdentifier.Inputs, '   \n  \t  ');
      expect(result).toBe('<!-- inputs:start -->');
    });

    it('should handle content with existing newlines', () => {
      const content = '\n## Inputs\nDescription\n';
      const result = service.wrapWithMarkers(SectionIdentifier.Inputs, content);
      
      expect(result).toBe('<!-- inputs:start -->\n\n## Inputs\nDescription\n\n<!-- inputs:end -->');
    });
  });

  describe('canMigrate', () => {
    let testMapping: ToolSectionMapping;

    beforeEach(() => {
      testMapping = {
        toolName: 'test-tool',
        sectionMappings: {},
        patterns: {
          startMarkerPattern: /test/g,
          detectionPattern: /<!--\s*test-\w+\s*-->/,
        },
      };
    });

    it('should return true when content matches detection pattern', () => {
      const content = 'Some content with <!-- test-inputs --> marker';
      expect(service.canMigrate(testMapping, content)).toBe(true);
    });

    it('should return false when content does not match detection pattern', () => {
      const content = 'Some content without matching markers';
      expect(service.canMigrate(testMapping, content)).toBe(false);
    });

    it('should work with complex patterns', () => {
      testMapping.patterns.detectionPattern = /<!--\s*action-docs-\w+\s+source=["'][^"']+["']\s*-->/;
      
      const matchingContent = '<!-- action-docs-inputs source="action.yml" -->';
      const nonMatchingContent = '<!-- action-docs-inputs -->';
      
      expect(service.canMigrate(testMapping, matchingContent)).toBe(true);
      expect(service.canMigrate(testMapping, nonMatchingContent)).toBe(false);
    });
  });
});