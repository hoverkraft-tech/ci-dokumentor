import { HeaderSectionMixin, FormatterAdapter, ReadableContent, RepositoryInfo } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class HeaderSectionGenerator extends HeaderSectionMixin<GitLabCIManifest, typeof GitLabCISectionGeneratorAdapter>(GitLabCISectionGeneratorAdapter) {
  public override generateTitle(
    formatterAdapter: FormatterAdapter,
    manifest: GitLabCIManifest,
    repositoryInfo: RepositoryInfo
  ): ReadableContent {
    const title = manifest.name || repositoryInfo.name || 'GitLab CI Pipeline';

    return formatterAdapter.heading(
      new ReadableContent(title),
      1
    );
  }

  public override getLogoAltText(manifest: GitLabCIManifest): ReadableContent {
    return new ReadableContent(manifest.name || 'GitLab CI');
  }
}