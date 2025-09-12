import { inject, injectable } from 'inversify';
import { MigrationAdapter, SectionMappingService, ToolSectionMapping, SectionIdentifier } from '@ci-dokumentor/core';

/**
 * Migration adapter for action-docs tool
 * Transforms markers like:
 * <!-- action-docs-header source="action.yml" --> -> <!-- header:start -->
 * <!-- action-docs-description source="action.yml" --> -> <!-- overview:start -->
 * <!-- action-docs-inputs source="action.yml" --> -> <!-- inputs:start -->
 * <!-- action-docs-outputs source="action.yml" --> -> <!-- outputs:start -->
 * <!-- action-docs-runs source="action.yml" --> -> <!-- usage:start -->
 */
@injectable()
export class ActionDocsMigrationAdapter implements MigrationAdapter {
  private readonly toolMapping: ToolSectionMapping = {
    toolName: 'action-docs',
    sectionMappings: {
      'header': SectionIdentifier.Header,
      'description': SectionIdentifier.Overview,
      'inputs': SectionIdentifier.Inputs,
      'outputs': SectionIdentifier.Outputs,
      'runs': SectionIdentifier.Usage,
    },
    patterns: {
      startMarkerPattern: /<!--\s*action-docs-(\w+)\s+source=["'][^"']+["']\s*-->/g,
      detectionPattern: /<!--\s*action-docs-\w+\s+source=["'][^"']+["']\s*-->/,
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
    
    migratedContent = migratedContent.replace(pattern, (match, sectionName) => {
      const standardSection = this.sectionMappingService.mapToStandardSection(
        this.toolMapping, 
        sectionName.toLowerCase()
      );
      
      if (!standardSection) {
        // If we can't map the section, keep the original marker
        return match;
      }
      
      // Simply replace with ci-dokumentor start marker
      // The ci-dokumentor system will handle adding end markers when content is generated
      return this.sectionMappingService.getStartMarker(standardSection);
    });

    return migratedContent;
  }
}