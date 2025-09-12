import { inject, injectable } from 'inversify';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import type { FormatterAdapter } from '../formatter/formatter.adapter.js';
import { FORMATTER_ADAPTER_IDENTIFIER } from '../formatter/formatter.adapter.js';

/**
 * Interface for defining tool-specific section mappings
 */
export interface ToolSectionMapping {
  /**
   * The name/identifier of the tool
   */
  toolName: string;

  /**
   * Mapping from tool section names to ci-dokumentor section identifiers
   */
  sectionMappings: Record<string, SectionIdentifier>;

  /**
   * Tool-specific pattern configurations
   */
  patterns: {
    /**
     * Pattern to detect start markers from this tool
     */
    startMarkerPattern: RegExp;
    
    /**
     * Pattern to detect end markers from this tool (optional for tools that don't use end markers)
     */
    endMarkerPattern?: RegExp;
    
    /**
     * Pattern to detect any markers from this tool (used for canMigrate check)
     */
    detectionPattern: RegExp;
  };
}

/**
 * Service for managing documentation section mappings and patterns
 * Centralizes section names and patterns to avoid duplication across migration adapters
 */
@injectable()
export class SectionMappingService {
  constructor(
    @inject(FORMATTER_ADAPTER_IDENTIFIER)
    private readonly formatterAdapter: FormatterAdapter
  ) {}

  /**
   * Get the standardized start marker for a section
   */
  getStartMarker(section: SectionIdentifier): string {
    const marker = this.formatterAdapter.comment(Buffer.from(`${section}:start`));
    return marker.toString().trim(); // Remove trailing newline for consistency
  }

  /**
   * Get the standardized end marker for a section
   */
  getEndMarker(section: SectionIdentifier): string {
    const marker = this.formatterAdapter.comment(Buffer.from(`${section}:end`));
    return marker.toString().trim(); // Remove trailing newline for consistency
  }

  /**
   * Get all available section identifiers
   */
  getAvailableSections(): SectionIdentifier[] {
    return Object.values(SectionIdentifier);
  }

  /**
   * Map an external tool section name to a ci-dokumentor section identifier
   */
  mapToStandardSection(toolMapping: ToolSectionMapping, externalSectionName: string): SectionIdentifier | null {
    const normalizedName = externalSectionName.toLowerCase().trim();
    return toolMapping.sectionMappings[normalizedName] || null;
  }

  /**
   * Create section markers with content
   */
  wrapWithMarkers(section: SectionIdentifier, content: string): string {
    const startMarker = this.getStartMarker(section);
    const endMarker = this.getEndMarker(section);
    
    if (!content.trim()) {
      return startMarker;
    }
    
    return `${startMarker}\n${content}\n${endMarker}`;
  }

  /**
   * Check if content can be migrated using the given tool mapping
   */
  canMigrate(toolMapping: ToolSectionMapping, content: string): boolean {
    return toolMapping.patterns.detectionPattern.test(content);
  }
}