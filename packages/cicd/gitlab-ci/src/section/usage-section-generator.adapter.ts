import { SectionIdentifier, ReadableContent, SectionGenerationPayload, SectionOptions, SectionGeneratorAdapter, VersionService } from '@ci-dokumentor/core';
import { inject, injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

export interface UsageSectionOptions extends SectionOptions {
  version?: string;
}

@injectable()
export class UsageSectionGenerator extends GitLabCISectionGeneratorAdapter implements SectionGeneratorAdapter<GitLabCIManifest, UsageSectionOptions> {
  private version?: string;

  constructor(
    @inject(VersionService) private readonly versionService: VersionService
  ) {
    super();
  }

  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Usage;
  }

  override getSectionOptions() {
    return {
      version: {
        flags: '--version <version>',
        description: 'Version identifier of the manifest (tag, branch, commit SHA, etc.)',
      },
    };
  }

  override setSectionOptions({
    version,
  }: Partial<UsageSectionOptions>): void {
    this.version = version;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    // Resolve version information from section options or auto-detection
    const version = await this.versionService.getVersion(this.version, repositoryProvider);
    const versionTag = version?.ref || 'latest';
    
    if (this.isGitLabComponent(manifest)) {
      // For GitLab components
      const usageExample = `include:
  - component: ${manifest.usesName}
    with:
      # Add component inputs here`;

      return formatterAdapter.code(
        new ReadableContent(usageExample),
        new ReadableContent('yaml')
      );
    }

    if (this.isGitLabCIPipeline(manifest)) {
      // For GitLab CI pipelines that can be included
      const usageExample = `include:
  - project: '${manifest.usesName.split('@')[0]}'
    file: '.gitlab-ci.yml'
    ref: '${versionTag}'`;

      return formatterAdapter.code(
        new ReadableContent(usageExample),
        new ReadableContent('yaml')
      );
    }

    return ReadableContent.empty();
  }
}