import { Repository } from '@ci-dokumentor/core';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';

export class OverviewSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Overview;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubAction | GitHubWorkflow,
    _repository: Repository
  ): Buffer {
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
