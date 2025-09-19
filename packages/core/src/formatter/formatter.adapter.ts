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

  appendContent(...inputs: Buffer[]): Buffer;

  heading(input: Buffer, level?: number): Buffer;

  center(input: Buffer): Buffer;

  paragraph(input: Buffer): Buffer;

  bold(input: Buffer): Buffer;

  italic(input: Buffer): Buffer;

  code(input: Buffer, language?: Buffer): Buffer;

  inlineCode(input: Buffer): Buffer;

  link(text: Buffer, url: Buffer): Buffer;

  image(
    url: Buffer,
    altText: Buffer,
    options?: { width?: string; align?: string }
  ): Buffer;

  table(headers: Buffer[], rows: Buffer[][]): Buffer;

  badge(label: Buffer, message: Buffer, color?: Buffer): Buffer;

  horizontalRule(): Buffer;

  lineBreak(): Buffer;

  /**
   * Wrap content in section markers
   */
  section(section: SectionIdentifier, input: Buffer): Buffer;

  sectionStart(section: SectionIdentifier): Buffer;

  sectionEnd(section: SectionIdentifier): Buffer;
}
