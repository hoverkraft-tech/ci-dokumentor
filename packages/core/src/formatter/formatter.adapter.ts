import { ReadableContent } from '../reader/readable-content.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { FormatterLanguage } from './formatter-language.js';

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

  heading(content: ReadableContent, level?: number): ReadableContent;

  center(content: ReadableContent): ReadableContent;

  paragraph(content: ReadableContent): ReadableContent;

  bold(content: ReadableContent): ReadableContent;

  italic(content: ReadableContent): ReadableContent;

  code(content: ReadableContent, language?: ReadableContent): ReadableContent;

  inlineCode(content: ReadableContent): ReadableContent;

  link(text: ReadableContent, url: ReadableContent): ReadableContent;

  image(
    url: ReadableContent,
    altText: ReadableContent,
    options?: { width?: string; align?: string }
  ): ReadableContent;

  table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent;

  badge(label: ReadableContent, message: ReadableContent, color?: ReadableContent): ReadableContent;

  list(items: ReadableContent[], ordered?: boolean): ReadableContent;

  horizontalRule(): ReadableContent;

  lineBreak(): ReadableContent;

  /**
   * Wrap content in section markers
   */
  section(section: SectionIdentifier, content: ReadableContent): ReadableContent;

  sectionStart(section: SectionIdentifier): ReadableContent;

  sectionEnd(section: SectionIdentifier): ReadableContent;
}
