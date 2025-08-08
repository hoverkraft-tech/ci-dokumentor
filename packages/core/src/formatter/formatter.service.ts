import { multiInject } from 'inversify';
import {
  FORMATTER_ADAPTER_IDENTIFIER,
  FormatterAdapter,
} from './formatter.adapter.js';
import { FormatterLanguage } from './formatter-language.js';

export class FormatterService {
  constructor(
    @multiInject(FORMATTER_ADAPTER_IDENTIFIER)
    private readonly formatterAdapters: FormatterAdapter[]
  ) {}

  getFormatterAdapterForFile(filePath: string): FormatterAdapter {
    const fileExtension = this.getFileLanguage(filePath);

    for (const formatterAdapter of this.formatterAdapters) {
      if (formatterAdapter.supportsLanguage(fileExtension)) {
        return formatterAdapter;
      }
    }

    throw new Error(`No formatter adapter found for file: ${filePath}`);
  }

  private getFileLanguage(filePath: string): FormatterLanguage {
    // Determine the file language based on the file extension or content.
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'md':
      case 'markdown':
        return FormatterLanguage.Markdown;
      default:
        throw new Error(`Unsupported language for file: ${filePath}`);
    }
  }
}
