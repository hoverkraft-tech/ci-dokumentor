import { OverviewSectionMixin, ReadableContent, FormatterAdapter } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends OverviewSectionMixin<GitHubActionsManifest, typeof GitHubActionsSectionGeneratorAdapter>(GitHubActionsSectionGeneratorAdapter) {
  public override getDescription(manifest: GitHubActionsManifest): string | undefined {
    return 'description' in manifest ? manifest.description : undefined;
  }

  /**
   * Gets the numeric priority of a permission level for comparison.
   * Higher numbers indicate higher permission levels.
   */
  private getPermissionPriority(level: string): number {
    const priorities: Record<string, number> = {
      'none': 0,
      'read': 1,
      'write': 2,
    };
    return priorities[level] ?? 0;
  }

  /**
   * Returns the higher permission level between two levels.
   * @param level1 First permission level
   * @param level2 Second permission level
   * @returns The higher permission level
   */
  private getHigherPermissionLevel(level1: string, level2: string): string {
    return this.getPermissionPriority(level1) >= this.getPermissionPriority(level2) ? level1 : level2;
  }

  public override async generateAdditionalContent(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): Promise<ReadableContent> {
    if (!this.isGitHubWorkflow(manifest)) {
      return ReadableContent.empty();
    }

    // Merge permissions from manifest.permissions and all jobs, keeping the highest level
    const mergedPermissions: Record<string, string> = { ...(manifest.permissions || {}) };
    
    // Add permissions from each job, keeping the highest permission level
    if (manifest.jobs) {
      for (const job of Object.values(manifest.jobs)) {
        if (job.permissions) {
          for (const [permission, level] of Object.entries(job.permissions)) {
            if (permission in mergedPermissions) {
              // Keep the higher permission level
              mergedPermissions[permission] = this.getHigherPermissionLevel(mergedPermissions[permission], level);
            } else {
              mergedPermissions[permission] = level;
            }
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
