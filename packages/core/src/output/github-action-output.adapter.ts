import { OutputAdapter } from './output.adapter.js';

/**
 * GitHub Actions output adapter that writes in GitHub Actions workflow format
 * Uses GitHub Actions output commands to set step outputs and create job summaries
 */
export class GithubActionOutputAdapter implements OutputAdapter {
  private sections: Record<string, string> = {};

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    const content = data.toString('utf-8');
    this.sections[sectionIdentifier] = content;

    // Write GitHub Actions output command for this section
    const escapedContent = this.escapeGitHubActionsData(content);
    
    // Set output variable for the section
    process.stdout.write(`::set-output name=${sectionIdentifier}::${escapedContent}\n`);
    
    // Also add to job summary if content is meaningful
    if (content.trim()) {
      process.stdout.write(`::group::📝 ${sectionIdentifier}\n`);
      process.stdout.write(content);
      if (!content.endsWith('\n')) {
        process.stdout.write('\n');
      }
      process.stdout.write('::endgroup::\n');
    }
  }

  /**
   * Escape data for GitHub Actions output format
   * GitHub Actions requires special characters to be escaped
   */
  private escapeGitHubActionsData(data: string): string {
    return data
      .replace(/%/g, '%25')  // Must be first
      .replace(/\r/g, '%0D')
      .replace(/\n/g, '%0A');
  }
}