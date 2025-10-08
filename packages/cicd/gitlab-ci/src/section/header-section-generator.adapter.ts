import { AbstractHeaderSectionGenerator, FormatterAdapter, ReadableContent, RepositoryInfo, SectionIdentifier, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class HeaderSectionGenerator extends GitLabCISectionGeneratorAdapter {
  private helper = new AbstractHeaderSectionGenerator<GitLabCIManifest>();

  getSectionIdentifier(): SectionIdentifier {
    return this.helper.getSectionIdentifier();
  }

  async generateSection(payload: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    return this.helper.generateSection.call(this, payload);
  }

  protected generateTitle(
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

  protected getLogoAltText(manifest: GitLabCIManifest): ReadableContent {
    return new ReadableContent(manifest.name || 'GitLab CI');
  }

  protected generateLogo(
    formatterAdapter: FormatterAdapter,
    manifest: GitLabCIManifest,
    logoPath: string | undefined,
    destination: string | undefined
  ): ReadableContent {
    return this.helper.generateLogo(
      formatterAdapter,
      manifest,
      logoPath,
      destination,
      (m: GitLabCIManifest) => this.getLogoAltText(m)
    );
  }
}