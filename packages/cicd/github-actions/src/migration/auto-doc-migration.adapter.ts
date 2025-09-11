import { inject, injectable } from 'inversify';
import { MigrationAdapter, SectionMappingService, ToolSectionMapping, SectionIdentifier } from '@ci-dokumentor/core';

/**
 * Migration adapter for auto-doc tool
 * Transforms markers like:
 * ## Inputs -> <!-- inputs:start -->\n## Inputs\n<!-- inputs:end -->
 * ## Outputs -> <!-- outputs:start -->\n## Outputs\n<!-- outputs:end -->
 * ## Secrets -> <!-- secrets:start -->\n## Secrets\n<!-- secrets:end -->
 * ## Description -> <!-- overview:start -->\n## Description\n<!-- overview:end -->
 */
@injectable()
export class AutoDocMigrationAdapter implements MigrationAdapter {
  private readonly toolMapping: ToolSectionMapping = {
    toolName: 'auto-doc',
    sectionMappings: {
      'inputs': SectionIdentifier.Inputs,
      'outputs': SectionIdentifier.Outputs,
      'secrets': SectionIdentifier.Secrets,
      'description': SectionIdentifier.Overview,
    },
    patterns: {
      startMarkerPattern: /^(##\s+(Inputs|Outputs|Secrets|Description))\s*$/gm,
      detectionPattern: /^##\s+(Inputs|Outputs|Secrets|Description)\s*$/m,
    },
  };

  constructor(
    @inject(SectionMappingService)
    private readonly sectionMappingService: SectionMappingService
  ) {}

  getToolName(): string {
    return this.toolMapping.toolName;
  }

  canMigrate(content: string): boolean {
    return this.sectionMappingService.canMigrate(this.toolMapping, content);
  }

  migrate(content: string): string {
    let migratedContent = content;

    // Use the adapter's own mapping configuration
    const pattern = this.toolMapping.patterns.startMarkerPattern;
    
    // Find all headers first
    const headerMatches = Array.from(migratedContent.matchAll(pattern));
    
    // Process headers in reverse order to avoid index issues
    for (let i = headerMatches.length - 1; i >= 0; i--) {
      const match = headerMatches[i];
      const fullMatch = match[0];
      const header = match[1];
      const sectionName = match[2];
      
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping,
        sectionName.toLowerCase()
      );
      
      if (!standardSection) {
        continue;
      }

      // Find the end of this section (next header or end of content)
      const sectionStartIndex = match.index!;
      const afterHeaderIndex = sectionStartIndex + fullMatch.length;
      
      let sectionEndIndex = migratedContent.length;
      
      // Look for the next header after this one
      for (let j = i + 1; j < headerMatches.length; j++) {
        if (headerMatches[j].index! > sectionStartIndex) {
          sectionEndIndex = headerMatches[j].index!;
          break;
        }
      }
      
      // If no next header found in our matches, look for any header
      if (sectionEndIndex === migratedContent.length) {
        const remainingContent = migratedContent.substring(afterHeaderIndex);
        const nextHeaderMatch = remainingContent.match(/^#{1,6}\s+/m);
        if (nextHeaderMatch) {
          sectionEndIndex = afterHeaderIndex + nextHeaderMatch.index!;
        }
      }
      
      const sectionContent = migratedContent.substring(afterHeaderIndex, sectionEndIndex).trim();
      
      // Wrap the header and content with ci-dokumentor markers
      const contentToWrap = sectionContent ? `${header}\n${sectionContent}` : header;
      const wrappedContent = this.sectionMappingService.wrapWithMarkers(standardSection, contentToWrap);
      
      // Replace the section in the content
      migratedContent = migratedContent.substring(0, sectionStartIndex) + 
                      wrappedContent + 
                      migratedContent.substring(sectionEndIndex);
    }

    return migratedContent;
  }
}