import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { FormatterLanguage } from './formatter-language.js';
import { ReadableContent } from '../reader/reader.adapter.js';

export const FORMATTER_ADAPTER_IDENTIFIER = Symbol('FormatterAdapter');

export enum LinkFormat {
  Auto = 'auto',
  Full = 'full',
  None = 'none'
}

export type FormatterOptions = {
  /**
   * Link format for transforming bare URLs in text to markdown links
   */
  linkFormat: LinkFormat;
};

export interface FormatterAdapter {
  supportsLanguage(language: FormatterLanguage): boolean;

  /**
   * Set formatter options that affect formatting behavior
   */
  setOptions(options: FormatterOptions): void;

  appendContent(...inputs: ReadableContent[]): ReadableContent;

  heading(input: ReadableContent, level?: number): ReadableContent;

  center(input: ReadableContent): ReadableContent;

  paragraph(input: ReadableContent): ReadableContent;

  bold(input: ReadableContent): ReadableContent;

  italic(input: ReadableContent): ReadableContent;

  code(input: ReadableContent, language?: ReadableContent): ReadableContent;

  inlineCode(input: ReadableContent): ReadableContent;

  link(text: ReadableContent, url: ReadableContent): ReadableContent;

  image(
    url: ReadableContent,
    altText: ReadableContent,
    options?: { width?: string; align?: string }
  ): ReadableContent;

  table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent;

  badge(label: ReadableContent, message: ReadableContent, color?: ReadableContent): ReadableContent;

  horizontalRule(): ReadableContent;

  lineBreak(): ReadableContent;

  /**
   * Wrap content in section markers
   */
  section(section: SectionIdentifier, input: ReadableContent): ReadableContent;

  sectionStart(section: SectionIdentifier): ReadableContent;

  sectionEnd(section: SectionIdentifier): ReadableContent;
}
