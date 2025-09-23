import { ReadableContent, SectionGenerationPayload, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Overview;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    const description =
      'description' in manifest ? manifest.description : undefined;
    if (!description) {
      return ReadableContent.empty();
    }

    let overviewContent = formatterAdapter.heading(new ReadableContent('Overview'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(description)),
    );

    if (this.isGitHubWorkflow(manifest)) {
      overviewContent = overviewContent.append(
        formatterAdapter.lineBreak(),
        formatterAdapter.heading(new ReadableContent('Permissions'), 3),
        formatterAdapter.lineBreak(),
      );

      const permissions = manifest.permissions || {};
      Object.entries(permissions).forEach(
        ([permission, level]) => {
          overviewContent = overviewContent.append(formatterAdapter.paragraph(
            new ReadableContent(`- **${permission}**: ${level}`)
          ));
        }
      );
    }

    return overviewContent;
  }
}
