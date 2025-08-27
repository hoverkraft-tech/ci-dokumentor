import { FormatterLanguage } from './formatter-language.js';

export const FORMATTER_ADAPTER_IDENTIFIER = Symbol('FormatterAdapter');

export interface FormatterAdapter {
  supportsLanguage(language: FormatterLanguage): boolean;

  heading(input: Buffer, level?: number): Buffer;

  center(input: Buffer): Buffer;

  comment(input: Buffer): Buffer;

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

  lineBreak(): Buffer;
}
