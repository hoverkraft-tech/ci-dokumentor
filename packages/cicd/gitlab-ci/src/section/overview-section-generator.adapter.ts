import { OverviewSectionMixin } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends OverviewSectionMixin<GitLabCIManifest, typeof GitLabCISectionGeneratorAdapter>(GitLabCISectionGeneratorAdapter) {
  public override getDescription(manifest: GitLabCIManifest): string | undefined {
    return 'description' in manifest ? manifest.description : undefined;
  }
}