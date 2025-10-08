import { AbstractOverviewSectionGenerator, ReadableContent, FormatterAdapter, SectionIdentifier, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

const abstractHelper = new AbstractOverviewSectionGenerator();

@injectable()
export class OverviewSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return abstractHelper.getSectionIdentifier();
  }

  async generateSection(payload: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    return abstractHelper.generateSection.call(this, payload);
  }

  protected getDescription(manifest: GitHubActionsManifest): string | undefined {
    return 'description' in manifest ? manifest.description : undefined;
  }

  protected async generateAdditionalContent(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): Promise<ReadableContent> {
    if (!this.isGitHubWorkflow(manifest)) {
      return ReadableContent.empty();
    }

    const permissions = manifest.permissions || {};
    const permissionsContent = formatterAdapter.list(
      Object.entries(permissions).map(([permission, level]) => {
        return formatterAdapter
          .bold(formatterAdapter.inlineCode(new ReadableContent(permission)))
          .append(`: `, formatterAdapter.inlineCode(new ReadableContent(level)));
      })
    );

    if (!permissionsContent.isEmpty()) {
      return formatterAdapter
        .heading(new ReadableContent('Permissions'), 3)
        .append(formatterAdapter.lineBreak(), permissionsContent);
    }

    return ReadableContent.empty();
  }
}
