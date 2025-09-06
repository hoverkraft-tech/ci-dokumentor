import { SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class OverviewSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Overview;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const description =
      'description' in manifest ? manifest.description : undefined;
    if (!description) {
      return Buffer.from('');
    }

    const overviewContent = [
      formatterAdapter.heading(Buffer.from('Overview'), 2),
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(Buffer.from(description)),
    ];

    if (this.isGitHubWorkflow(manifest)) {
      const permissions = manifest.permissions || {};
      const permissionsContent = Object.entries(permissions).map(
        ([permission, level]) =>
          formatterAdapter.paragraph(
            Buffer.from(`- **${permission}**: ${level}`)
          )
      );
      overviewContent.push(
        formatterAdapter.lineBreak(),
        formatterAdapter.heading(Buffer.from('Permissions'), 3),
        formatterAdapter.lineBreak(),
        ...permissionsContent
      );
    }

    return Buffer.concat(overviewContent);
  }
}
