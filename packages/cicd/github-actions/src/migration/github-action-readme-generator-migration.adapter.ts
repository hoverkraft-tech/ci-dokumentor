import { injectable, injectFromBase } from 'inversify';
import { SectionIdentifier, ReadableContent } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';
import { AbstractMigrationAdapter } from './abstract-migration.adapter.js';

/**
 * Migration adapter for GitHub Action's Readme Generator tool
 * https://github.com/bitflight-devops/github-action-readme-generator
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
@injectFromBase({
  extendConstructorArguments: true,
})
export class GitHubActionReadmeGeneratorMigrationAdapter extends AbstractMigrationAdapter {
  protected readonly name = 'github-action-readme-generator';

  protected readonly sectionMappings: Record<string, SectionIdentifier> = {
    'branding': SectionIdentifier.Header,
    'title': SectionIdentifier.Header,
    'badges': SectionIdentifier.Badges,
    'description': SectionIdentifier.Overview,
    'usage': SectionIdentifier.Usage,
    'inputs': SectionIdentifier.Inputs,
    'outputs': SectionIdentifier.Outputs,
    'examples': SectionIdentifier.Examples,
  };

  protected readonly patterns = {
    startMarkerPattern: /<!--\s*start\s+([\w[\]/.-]+)\s*-->/gi,
    endMarkerPattern: /<!--\s*end\s+([\w[\]/.-]+)\s*-->/gi,
    detectionPattern: /<!--\s*(start|end)\s+[\w[\]/.-]+\s*-->/,
  };

  protected migrateContent(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
    // Normalize example paths inside the fragment to the 'examples' token
    const working = content.replace(/(<!--\s*(?:start|end)\s+)([\w[\]/.]+)(\s*-->)/gi, (m, p1, p2, p3) => {
      const normalized = p2.toLowerCase().includes('.github/ghadocs/examples') ? 'examples' : p2;
      return `${p1}${normalized}${p3}`;
    });

    // Process marker mappings first
    return this.processMarkerMappings(working, formatterAdapter);
  }

}