import { relative, dirname } from 'node:path';
import { FormatterAdapter } from '../../formatter/formatter.adapter.js';
import { ReadableContent } from '../../reader/readable-content.js';
import { RepositoryInfo } from '../../repository/repository.provider.js';
import { SectionGenerationPayload, SectionIdentifier } from './section-generator.adapter.js';

/**
 * Mixin type for Header section generator.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = abstract new (...args: any[]) => T;

/**
 * Mixin for Header section generator.
 * This section displays the title and logo at the top of documentation.
 * Platform-specific implementations provide title generation logic.
 */
export function HeaderSectionMixin<TManifest, TBase extends Constructor>(Base: TBase) {
  abstract class HeaderSectionGeneratorBase extends Base {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
    }
    getSectionIdentifier(): SectionIdentifier {
      return SectionIdentifier.Header;
    }

    async generateSection({ formatterAdapter, manifest, repositoryProvider, destination }: SectionGenerationPayload<TManifest>): Promise<ReadableContent> {
      const [repositoryInfo, logo] = await Promise.all([
        repositoryProvider.getRepositoryInfo(),
        repositoryProvider.getLogo(),
      ]);

      let sectionContent = this.generateTitle(
        formatterAdapter,
        manifest,
        repositoryInfo
      );

      const logoContent = this.generateLogoImpl(
        formatterAdapter,
        manifest,
        logo,
        destination
      );

      if (!logoContent.isEmpty()) {
        // Ensure the heading (H1) is the very first content in the file so
        // markdown linters (MD041) treat the first line as a top-level heading.
        // Place the centered logo after the heading separated by a line break,
        // and add a horizontal rule after the logo for visual separation.
        sectionContent = sectionContent.append(
          formatterAdapter.lineBreak(),
          logoContent,
          formatterAdapter.lineBreak(),
          formatterAdapter.horizontalRule(),
          formatterAdapter.lineBreak(),
        );
      }

      return sectionContent;
    }

    /**
     * Generate the title (H1 heading) for the header.
     * Must be implemented by platform-specific classes.
     */
    public generateTitle(
      _formatterAdapter: FormatterAdapter,
      _manifest: TManifest,
      _repositoryInfo: RepositoryInfo
    ): ReadableContent {
      void _formatterAdapter;
      void _manifest;
      void _repositoryInfo;
      throw new Error('generateTitle() must be implemented by platform-specific class');
    }

    /**
     * Generate the logo content if a logo is provided.
     * This method handles file:// URL conversion to relative paths.
     * Internal implementation method.
     */
    public generateLogoImpl(
      formatterAdapter: FormatterAdapter,
      manifest: TManifest,
      logoPath: string | undefined,
      destination: string | undefined
    ): ReadableContent {
      if (!logoPath) {
        return ReadableContent.empty();
      }

      // Calculate relative path for file:// URLs
      let resolvedLogoPath = logoPath;
      if (logoPath.startsWith('file://') && destination) {
        const filePath = logoPath.replace(/^file:\/\//, '');
        const destinationDir = dirname(destination);
        resolvedLogoPath = relative(destinationDir, filePath);
      } else if (logoPath.startsWith('file://')) {
        // If no destination, just remove the file:// prefix
        resolvedLogoPath = logoPath.replace(/^file:\/\//, '');
      }

      const logoAltText = this.getLogoAltText(manifest);
      const logoImage = formatterAdapter.image(new ReadableContent(resolvedLogoPath), logoAltText, {
        width: '60px',
        align: 'center',
      });

      return formatterAdapter.center(logoImage);
    }

    /**
     * Get the alt text for the logo image.
     * Platform-specific implementations can override this to provide custom alt text.
     */
    public getLogoAltText(_manifest: TManifest): ReadableContent {
      void _manifest;
      throw new Error('getLogoAltText() must be implemented by platform-specific class');
    }
  }

  return HeaderSectionGeneratorBase;
}
