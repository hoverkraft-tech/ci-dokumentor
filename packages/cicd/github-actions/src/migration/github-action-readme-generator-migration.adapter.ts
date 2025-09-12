import { inject, injectable } from 'inversify';
import { MigrationAdapter, SectionMappingService, ToolSectionMapping, SectionIdentifier } from '@ci-dokumentor/core';

/**
 * Migration adapter for GitHub Action's Readme Generator tool
 * Transforms markers like:
 * <!-- start branding --> / <!-- end branding --> -> <!-- badges:start --> / <!-- badges:end -->
 * <!-- start title --> / <!-- end title --> -> <!-- header:start --> / <!-- header:end -->
 * <!-- start badges --> / <!-- end badges --> -> <!-- badges:start --> / <!-- badges:end -->
 * <!-- start description --> / <!-- end description --> -> <!-- overview:start --> / <!-- overview:end -->
 * <!-- start contents --> / <!-- end contents --> -> <!-- contents:start --> / <!-- contents:end -->
 * <!-- start usage --> / <!-- end usage --> -> <!-- usage:start --> / <!-- usage:end -->
 * <!-- start inputs --> / <!-- end inputs --> -> <!-- inputs:start --> / <!-- inputs:end -->
 * <!-- start outputs --> / <!-- end outputs --> -> <!-- outputs:start --> / <!-- outputs:end -->
 * <!-- start [.github/ghadocs/examples/] --> / <!-- end [.github/ghadocs/examples/] --> -> <!-- examples:start --> / <!-- examples:end -->
 */
@injectable()
export class GitHubActionReadmeGeneratorMigrationAdapter implements MigrationAdapter {
  private readonly toolMapping: ToolSectionMapping = {
    toolName: 'github-action-readme-generator',
    sectionMappings: {
      'branding': SectionIdentifier.Badges, // Map branding to badges section
      'title': SectionIdentifier.Header,
      'badges': SectionIdentifier.Badges,
      'description': SectionIdentifier.Overview,
      'contents': SectionIdentifier.Contents,
      'usage': SectionIdentifier.Usage,
      'inputs': SectionIdentifier.Inputs,
      'outputs': SectionIdentifier.Outputs,
      'examples': SectionIdentifier.Examples,
    },
    patterns: {
      startMarkerPattern: /<!--\s*start\s+([\w[\]/.]+)\s*-->/gi,
      endMarkerPattern: /<!--\s*end\s+([\w[\]/.]+)\s*-->/gi,
      detectionPattern: /<!--\s*(start|end)\s+[\w[\]/.]+\s*-->/,
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
    const startPattern = this.toolMapping.patterns.startMarkerPattern;
    const endPattern = this.toolMapping.patterns.endMarkerPattern!;

    // Replace start markers
    migratedContent = migratedContent.replace(startPattern, (match, sectionName) => {
      // Normalize section name (handle special cases like [.github/ghadocs/examples/])
      let normalizedSectionName = sectionName.toLowerCase().trim();
      
      // Special handling for examples path
      if (normalizedSectionName.includes('.github/ghadocs/examples')) {
        normalizedSectionName = 'examples';
      }
      
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping,
        normalizedSectionName
      );
      
      if (!standardSection) {
        return match;
      }
      
      return this.sectionMappingService.getStartMarker(standardSection);
    });

    // Replace end markers
    migratedContent = migratedContent.replace(endPattern, (match, sectionName) => {
      // Normalize section name (handle special cases like [.github/ghadocs/examples/])
      let normalizedSectionName = sectionName.toLowerCase().trim();
      
      // Special handling for examples path
      if (normalizedSectionName.includes('.github/ghadocs/examples')) {
        normalizedSectionName = 'examples';
      }
      
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping,
        normalizedSectionName
      );
      
      if (!standardSection) {
        return match;
      }
      
      return this.sectionMappingService.getEndMarker(standardSection);
    });

    return migratedContent;
  }
}