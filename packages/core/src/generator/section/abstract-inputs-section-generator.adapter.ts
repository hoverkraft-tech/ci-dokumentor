import { FormatterAdapter } from '../../formatter/formatter.adapter.js';
import { ReadableContent } from '../../reader/readable-content.js';
import { SectionGenerationPayload, SectionIdentifier } from './section-generator.adapter.js';

/**
 * Input entry with name and properties.
 * Platform-specific implementations should define their own input types.
 */
export interface InputEntry {
  name: string;
  description?: string;
  required?: boolean;
  default?: string | boolean | number | null;
  type?: string;
}

/**
 * Base class for Inputs section generator.
 * This section displays input parameters in a table format.
 * Platform-specific implementations provide the input extraction and table generation logic.
 */
export class AbstractInputsSectionGenerator<TManifest> {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Inputs;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<TManifest>): Promise<ReadableContent> {
    const inputsContent = await this.generateInputsContent(formatterAdapter, manifest);

    if (inputsContent.isEmpty()) {
      return ReadableContent.empty();
    }

    return formatterAdapter.heading(new ReadableContent('Inputs'), 2).append(
      formatterAdapter.lineBreak(),
      inputsContent,
    );
  }

  /**
   * Generate the inputs content (table or multiple tables).
   * Must be implemented by platform-specific classes.
   */
  protected async generateInputsContent(
    _formatterAdapter: FormatterAdapter,
    _manifest: TManifest
  ): Promise<ReadableContent> {
    throw new Error('generateInputsContent() must be implemented by platform-specific class');
  }

  /**
   * Helper method to format input name with bold and inline code.
   */
  public formatInputName(
    name: string,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(new ReadableContent(name))
    );
  }

  /**
   * Helper method to format input description.
   */
  public formatInputDescription(
    description: string | undefined,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    const desc = new ReadableContent((description || '').trim());
    if (!desc.isEmpty()) {
      return formatterAdapter.paragraph(desc);
    }
    return desc;
  }

  /**
   * Helper method to format input default value.
   */
  public formatInputDefault(
    defaultValue: string | boolean | number | null | undefined,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    const hasNotDefault = defaultValue === null || defaultValue === undefined || defaultValue === '';
    if (hasNotDefault) {
      return new ReadableContent('-');
    }

    let defaultStr: string;
    if (typeof defaultValue === 'boolean') {
      defaultStr = defaultValue ? 'true' : 'false';
    } else {
      defaultStr = String(defaultValue);
    }

    return formatterAdapter.inlineCode(new ReadableContent(defaultStr));
  }

  /**
   * Helper method to format input required field.
   */
  public formatInputRequired(
    required: boolean | undefined,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      new ReadableContent(required ? 'true' : 'false')
    );
  }

  /**
   * Helper method to format input type.
   */
  public formatInputType(
    type: string | undefined,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(new ReadableContent(type ?? 'string'));
  }
}
