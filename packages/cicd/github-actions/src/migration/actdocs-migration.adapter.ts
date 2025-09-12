import { inject, injectable } from 'inversify';
import { MigrationAdapter, SectionMappingService, ToolSectionMapping, SectionIdentifier } from '@ci-dokumentor/core';

/**
 * Migration adapter for actdocs tool
 * Transforms markers like:
 * <!-- actdocs description start --> / <!-- actdocs description end --> -> <!-- overview:start --> / <!-- overview:end -->
 * <!-- actdocs inputs start --> / <!-- actdocs inputs end --> -> <!-- inputs:start --> / <!-- inputs:end -->
 * <!-- actdocs secrets start --> / <!-- actdocs secrets end --> -> <!-- secrets:start --> / <!-- secrets:end -->
 * <!-- actdocs outputs start --> / <!-- actdocs outputs end --> -> <!-- outputs:start --> / <!-- outputs:end -->
 * <!-- actdocs permissions start --> / <!-- actdocs permissions end --> -> <!-- security:start --> / <!-- security:end -->
 */
@injectable()
export class ActdocsMigrationAdapter implements MigrationAdapter {
  private readonly toolMapping: ToolSectionMapping = {
    toolName: 'actdocs',
    sectionMappings: {
      'description': SectionIdentifier.Overview,
      'inputs': SectionIdentifier.Inputs,
      'secrets': SectionIdentifier.Secrets,
      'outputs': SectionIdentifier.Outputs,
      'permissions': SectionIdentifier.Security, // Map permissions to security section
    },
    patterns: {
      startMarkerPattern: /<!--\s*actdocs\s+(\w+)\s+start\s*-->/gi,
      endMarkerPattern: /<!--\s*actdocs\s+(\w+)\s+end\s*-->/gi,
      detectionPattern: /<!--\s*actdocs\s+\w+\s+(start|end)\s*-->/,
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
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping,
        sectionName.toLowerCase()
      );
      
      if (!standardSection) {
        return match;
      }
      
      return this.sectionMappingService.getStartMarker(standardSection);
    });

    // Replace end markers
    migratedContent = migratedContent.replace(endPattern, (match, sectionName) => {
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping,
        sectionName.toLowerCase()
      );
      
      if (!standardSection) {
        return match;
      }
      
      return this.sectionMappingService.getEndMarker(standardSection);
    });

    return migratedContent;
  }
}