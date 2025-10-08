import { ReadableContent } from '../../reader/readable-content.js';
import { FormatterAdapter } from '../../formatter/formatter.adapter.js';
import { SectionGenerationPayload, SectionIdentifier } from './section-generator.adapter.js';

/**
 * Base class for Overview section generator.
 * This section displays the description of the manifest.
 * Platform-specific implementations can extend this to add additional content.
 */
export class AbstractOverviewSectionGenerator<TManifest> {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Overview;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<TManifest>): Promise<ReadableContent> {
    const description = this.getDescription(manifest);
    if (!description) {
      return ReadableContent.empty();
    }

    let overviewContent = formatterAdapter.heading(new ReadableContent('Overview'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(description).trim()),
    );

    // Allow platform-specific implementations to add additional content
    const additionalContent = await this.generateAdditionalContent(formatterAdapter, manifest);
    if (!additionalContent.isEmpty()) {
      overviewContent = overviewContent.append(
        formatterAdapter.lineBreak(),
        additionalContent,
      );
    }

    return overviewContent;
  }

  /**
   * Extract description from the manifest.
   * Must be implemented by platform-specific classes.
   */
  protected getDescription(_manifest: TManifest): string | undefined {
    throw new Error('getDescription() must be implemented by platform-specific class');
  }

  /**
   * Generate additional platform-specific content for the overview section.
   * Override this method to add custom content (e.g., permissions for workflows).
   * Default implementation returns empty content.
   */
  protected generateAdditionalContent(
    _formatterAdapter: FormatterAdapter,
    _manifest: TManifest
  ): Promise<ReadableContent> {
    return Promise.resolve(ReadableContent.empty());
  }
}
