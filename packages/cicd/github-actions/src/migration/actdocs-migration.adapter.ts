import { injectable } from 'inversify';
import { SectionIdentifier } from '@ci-dokumentor/core';
import type { FormatterAdapter, ReadableContent } from '@ci-dokumentor/core';
import { AbstractMigrationAdapter } from './abstract-migration.adapter.js';

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
export class ActdocsMigrationAdapter extends AbstractMigrationAdapter {
  protected readonly name = 'actdocs';

  protected readonly sectionMappings: Record<string, SectionIdentifier> = {
    'description': SectionIdentifier.Overview,
    'inputs': SectionIdentifier.Inputs,
    'secrets': SectionIdentifier.Secrets,
    'outputs': SectionIdentifier.Outputs,
    'permissions': SectionIdentifier.Security,
  };

  protected readonly patterns = {
    startMarkerPattern: /<!--\s*actdocs\s+(\w+)\s+start\s*-->/i,
    endMarkerPattern: /<!--\s*actdocs\s+(\w+)\s+end\s*-->/i,
    detectionPattern: /<!--\s*actdocs\s+\w+\s+(start|end)\s*-->/i,
  };

  protected async migrateContent(content: ReadableContent, formatterAdapter: FormatterAdapter): Promise<ReadableContent> {
    // Delegate the replacement logic to the shared helper in the abstract
    // adapter to avoid repeated stream -> buffer conversions across adapters.
    return await this.processMarkerMappings(content, formatterAdapter);
  }
}