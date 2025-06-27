import { FormatterLanguage } from "./formatter-language.js";

export const FORMATTER_ADAPTER_IDENTIFIER = Symbol("FormatterAdapter");

export interface FormatterAdapter {
    supportsLanguage(language: FormatterLanguage): boolean;

    heading(input: Buffer, level?: number): Buffer;

    center(input: Buffer): Buffer;

    comment(input: Buffer): Buffer;

    paragraph(input: Buffer): Buffer;

    bold(input: Buffer): Buffer;

    italic(input: Buffer): Buffer;

    code(input: Buffer, language?: string): Buffer;

    inlineCode(input: Buffer): Buffer;

    link(text: Buffer, url: string): Buffer;

    image(altText: Buffer, url: string, options?: { width?: string; align?: string }): Buffer;

    list(items: Buffer[], ordered?: boolean): Buffer;

    table(headers: Buffer[], rows: Buffer[][]): Buffer;

    badge(label: string, message: string, color?: string): Buffer;

    blockquote(input: Buffer): Buffer;

    details(summary: Buffer, content: Buffer): Buffer;

    lineBreak(): Buffer;

    horizontalRule(): Buffer;
}
