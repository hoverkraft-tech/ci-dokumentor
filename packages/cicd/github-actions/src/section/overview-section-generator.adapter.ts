import { OverviewSectionMixin, ReadableContent, FormatterAdapter } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends OverviewSectionMixin<GitHubActionsManifest, typeof GitHubActionsSectionGeneratorAdapter>(GitHubActionsSectionGeneratorAdapter) {
  public override getDescription(manifest: GitHubActionsManifest): string | undefined {
    return 'description' in manifest ? manifest.description : undefined;
  }

  public override async generateAdditionalContent(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): Promise<ReadableContent> {
    if (!this.isGitHubWorkflow(manifest)) {
      return ReadableContent.empty();
    }

    // Merge permissions from manifest.permissions and all jobs
    const mergedPermissions: Record<string, string> = { ...(manifest.permissions || {}) };
    
    // Add permissions from each job
    if (manifest.jobs) {
      for (const job of Object.values(manifest.jobs)) {
        if (job.permissions) {
          for (const [permission, level] of Object.entries(job.permissions)) {
            mergedPermissions[permission] = level;
          }
        }
      }
    }

    // Sort permissions alphabetically (ascending)
    const sortedPermissions = Object.entries(mergedPermissions).sort(([a], [b]) => a.localeCompare(b));
    
    const permissionsContent = formatterAdapter.list(
      sortedPermissions.map(([permission, level]) => {
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
