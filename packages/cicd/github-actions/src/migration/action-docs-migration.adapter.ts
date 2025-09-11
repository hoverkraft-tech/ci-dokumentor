import { injectable } from 'inversify';
import { SectionIdentifier } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';
import { AbstractMigrationAdapter } from './abstract-migration.adapter.js';

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
export class ActionDocsMigrationAdapter extends AbstractMigrationAdapter {
  protected readonly name = 'action-docs';

  protected readonly sectionMappings: Record<string, SectionIdentifier> = {
    'header': SectionIdentifier.Header,
    'description': SectionIdentifier.Overview,
    'inputs': SectionIdentifier.Inputs,
    'outputs': SectionIdentifier.Outputs,
    'runs': SectionIdentifier.Usage,
  };

  protected readonly patterns = {
    startMarkerPattern: /<!--\s*action-docs-(\w+)\s+source=["'][^"']+["']\s*-->/g,
    endMarkerPattern: /<!--\s*action-docs-(\w+)\s+source=["'][^"']+["']\s*-->/g,
    detectionPattern: /<!--\s*action-docs-\w+\s+source=["'][^"']+["']\s*-->/,
  };

  protected migrateContent(input: Buffer, formatterAdapter: FormatterAdapter): Buffer {
    // Delegate marker replacement and mapping to the base class helper which
    // operates on the provided Buffer fragment to avoid allocating large
    // intermediate strings here.
    return this.processMarkerMappings(input, formatterAdapter);
  }
}