import { inject, injectable } from 'inversify';
import { FormatterLanguage } from '../formatter-language.js';
import { FormatterAdapter, FormatterOptions, LinkFormat } from '../formatter.adapter.js';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { SectionIdentifier } from '../../generator/section-generator.adapter.js';
import { ReadableContent } from '../../reader/reader.adapter.js';

@injectable()
export class MarkdownFormatterAdapter implements FormatterAdapter {
  private options: FormatterOptions = {
    linkFormat: LinkFormat.Auto
  };

  constructor(
    @inject(MarkdownTableGenerator) private readonly markdownTableGenerator: MarkdownTableGenerator
  ) { }

  setOptions(options: FormatterOptions): void {
    this.options = { ...options };
  }

  supportsLanguage(language: FormatterLanguage): boolean {
    return language === FormatterLanguage.Markdown;
  }

  appendContent(...contents: ReadableContent[]): ReadableContent {
    // Fast single-allocation concatenation. Convert string parts to buffers and copy into
    // a pre-allocated content to avoid multiple intermediate allocations.
    if (!contents || contents.length === 0) {
      return Buffer.alloc(0);
    }

    // First pass: compute total length and normalize buffers lazily
    const contentParts: ReadableContent[] = new Array(contents.length);
    let total = 0;
    for (let i = 0; i < contents.length; i++) {
      const part = contents[i];
      contentParts[i] = part;
      total += contentParts[i].length;
    }

    if (contentParts.length === 1) {
      return contentParts[0];
    }

    const out = Buffer.allocUnsafe(total);
    let offset = 0;
    for (let i = 0; i < contentParts.length; i++) {
      const contentPart = contentParts[i];
      if (contentPart.length === 0) {
        continue;
      }
      contentPart.copy(out, offset);
      offset += contentPart.length;
    }
    return out;
  }

  heading(content: ReadableContent, level = 1): ReadableContent {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return this.appendContent(Buffer.from(`${hashes} `), content, this.lineBreak());
  }

  center(content: ReadableContent): ReadableContent {
    const lb = 0x0A; // \n
    // Trim leading/trailing whitespace/newlines
    let start = 0;
    let end = content.length - 1;
    while (start <= end && (content[start] === 0x20 /* space */ || content[start] === 0x09 /* tab */ || content[start] === 0x0A /* LF */ || content[start] === 0x0D /* CR */)) {
      start++;
    }
    while (end >= start && (content[end] === 0x20 /* space */ || content[end] === 0x09 /* tab */ || content[end] === 0x0A /* LF */ || content[end] === 0x0D /* CR */)) {
      end--;
    }

    const hasContent = end >= start;

    const parts: ReadableContent[] = [Buffer.from('<div align="center">')];

    if (hasContent) {
      // slice is zero-copy view over the original buffer
      const contentCopy = content.subarray(start, end + 1);
      // split on LF (0x0A), preserve lines; handle CR by trimming in each line
      const lines: ReadableContent[] = [];
      let lineStart = 0;
      for (let i = 0; i < contentCopy.length; i++) {
        if (contentCopy[i] === lb) {
          const lineBuf = contentCopy.subarray(lineStart, i);
          // trim trailing CR from the line
          const l = lineBuf.length > 0 && lineBuf[lineBuf.length - 1] === 0x0D ? lineBuf.subarray(0, lineBuf.length - 1) : lineBuf;
          lines.push(l);
          lineStart = i + 1;
        }
      }
      // last line
      if (lineStart <= contentCopy.length - 1) {
        const lineBuf = contentCopy.subarray(lineStart, contentCopy.length);
        const l = lineBuf.length > 0 && lineBuf[lineBuf.length - 1] === 0x0D ? lineBuf.subarray(0, lineBuf.length - 1) : lineBuf;
        lines.push(l);
      }

      // indent non-empty lines
      parts.push(this.lineBreak());
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
          parts.push(Buffer.from('  '), lines[i]);
        }
        if (i < lines.length - 1) parts.push(this.lineBreak());
      }
      parts.push(this.lineBreak());
    }

    parts.push(Buffer.from('</div>'), this.lineBreak());

    return this.appendContent(...parts);
  }

  paragraph(content: ReadableContent): ReadableContent {
    const linkFormat = this.options.linkFormat;
    let processedInput = linkFormat && linkFormat !== LinkFormat.None
      ? this.transformUrls(content, linkFormat === LinkFormat.Full)
      : content;

    processedInput = this.transformList(processedInput);

    return this.appendContent(processedInput, this.lineBreak());
  }

  bold(content: ReadableContent): ReadableContent {
    return this.appendContent(
      Buffer.from('**'),
      this.escape(content, '**'),
      Buffer.from('**')
    );
  }

  italic(input: ReadableContent): ReadableContent {
    return this.appendContent(
      Buffer.from('*'),
      this.escape(input, '*'),
      Buffer.from('*')
    );
  }

  code(content: ReadableContent, language?: ReadableContent): ReadableContent {
    return this.appendContent(
      Buffer.from('```'),
      language || Buffer.alloc(0),
      this.lineBreak(),
      this.trimTrailingLineBreaks(content),
      Buffer.from('```'),
      this.lineBreak(),
    );
  }

  inlineCode(content: ReadableContent): ReadableContent {
    return this.appendContent(
      Buffer.from('`'),
      this.escape(content, ['`', '*']),
      Buffer.from('`')
    );
  }

  link(text: ReadableContent, url: ReadableContent): ReadableContent {
    // If the text is already a single inline markdown link or image (e.g. "![...](...)" or "[...]()"),
    // don't escape it - callers sometimes pass pre-formatted markdown (badges) as the link text.
    const isInlineMarkdown = this.contentLooksLikeInlineMarkdown(text);
    return this.appendContent(
      Buffer.from('['),
      isInlineMarkdown ? text : this.escape(text, ['[', ']']),
      Buffer.from(']('),
      this.escape(url, ')'),
      Buffer.from(')')
    );
  }

  image(
    url: ReadableContent,
    altText: ReadableContent,
    options?: { width?: string; align?: string }
  ): ReadableContent {
    if (options?.width || options?.align) {
      // Use HTML img tag for advanced formatting (buffer-based)
      const attributes: ReadableContent[] = [];
      if (options.width) {
        attributes.push(Buffer.from(` width="${options.width}"`));
      }
      if (options.align) {
        attributes.push(Buffer.from(` align="${options.align}"`));
      }

      const parts: Buffer[] = [Buffer.from('<img src="'), url, Buffer.from('"')];
      if (attributes.length) {
        parts.push(...attributes);
      }

      parts.push(
        Buffer.from(` alt="`),
        this.escape(altText, ['[', ']']),
        Buffer.from(`" />`)
      );
      return this.appendContent(...parts);
    }

    return this.appendContent(
      Buffer.from('!['),
      this.escape(altText, ['[', ']']),
      Buffer.from(']('),
      this.escape(url, ')'),
      Buffer.from(')')
    );
  }

  table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent {
    return this.markdownTableGenerator.table(headers, rows);
  }

  badge(label: ReadableContent, url: ReadableContent): ReadableContent {
    return this.appendContent(
      Buffer.from('!['),
      this.escape(this.escape(label, '*'), ')'),
      Buffer.from(']('),
      this.escape(this.escape(url, '*'), ')'),
      Buffer.from(')')
    );
  }

  horizontalRule(): ReadableContent {
    return this.appendContent(Buffer.from('---'), this.lineBreak());
  }

  lineBreak(): ReadableContent {
    return Buffer.from('\n');
  }

  section(section: SectionIdentifier, content: ReadableContent): ReadableContent {
    const startMarker = this.sectionStart(section);
    const endMarker = this.sectionEnd(section);

    if (!content.length) {
      return this.appendContent(
        startMarker,
        this.lineBreak(),
        endMarker,
        this.lineBreak()
      );
    }

    return this.appendContent(
      startMarker,
      this.lineBreak(),
      this.lineBreak(),
      this.trimTrailingLineBreaks(content),
      this.lineBreak(),
      endMarker,
      this.lineBreak()
    );
  }

  sectionStart(section: SectionIdentifier): ReadableContent {
    return this.appendContent(Buffer.from('<!-- '), this.escape(Buffer.from(section), '<!-- '), Buffer.from(':start -->'));
  }

  sectionEnd(section: SectionIdentifier): ReadableContent {
    return this.appendContent(Buffer.from('<!-- '), this.escape(Buffer.from(section), '<!-- '), Buffer.from(':end -->'));
  }

  /**
   * Escape special characters in the input buffer for markdown.
   */
  private escape(input: ReadableContent, search: string | string[]): ReadableContent {
    if (!input || input.length === 0) {
      return Buffer.alloc(0);
    }
    if (!search || search.length === 0) {
      return input;
    }

    if (Array.isArray(search)) {
      let result = input;
      for (const s of search) {
        result = this.escape(result, s);
      }
      return result;
    }

    const searchBuf = Buffer.from(search);
    // Build replacement buffer: prefix each character with backslash
    const replaceStr = search.split('').map((c) => '\\' + c).join('');
    const replaceBuf = Buffer.from(replaceStr);

    const parts: ReadableContent[] = [];
    let idx = 0;
    let found = input.indexOf(searchBuf, idx);
    while (found !== -1) {
      if (found > idx) parts.push(input.subarray(idx, found));
      parts.push(replaceBuf);
      idx = found + searchBuf.length;
      found = input.indexOf(searchBuf, idx);
    }
    if (idx < input.length) parts.push(input.subarray(idx));

    if (parts.length === 0) {
      return Buffer.alloc(0);
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return this.appendContent(...parts);
  }

  /**
   * Quick heuristic to check if a buffer looks like a single inline markdown link/image
   * (e.g. "[text](url)" or "![alt](url)"), ignoring surrounding whitespace.
   */
  private contentLooksLikeInlineMarkdown(input: ReadableContent): boolean {
    if (!input || input.length === 0) {
      return false;
    }

    return /^\s*!?\[[^\]]*\]\([^)]*\)\s*$/.test(input.toString());
  }

  /**
   * Transform URLs in text to markdown links.
   * By default creates autolinks (<url>), or full links if fullLinkFormat is true.
   */
  private transformUrls(input: ReadableContent, fullLinkFormat = false): ReadableContent {
    if (!input || input.length === 0) return input;

    const text = input.toString();

    // URL regex pattern - matches http/https URLs, excluding common trailing punctuation
    // Use negative lookbehind/lookahead to avoid matching URLs already wrapped in '<' '>' (autolinks)
    const urlRegex = /(?<!<)https?:\/\/[^\s)\]>]{1,500}(?!>)/g;

    // Check if there are already markdown links in the text to avoid double-processing
    const linkRegex = /\[([^\]]{0,200})\]\(([^)]{0,500})\)/g;
    const hasExistingLinks = linkRegex.test(text);

    let result = text;

    if (!hasExistingLinks) {
      // Simple case: no existing markdown links, just transform all URLs
      // But skip URLs that are already in autolink format like <https://...>
      result = text.replace(urlRegex, (url, offset) => {
        // If the URL is already wrapped in '<' '>' then leave it untouched
        const beforeChar = offset > 0 ? text[offset - 1] : undefined;
        const afterChar = text[offset + url.length];
        if (beforeChar === '<' && afterChar === '>') {
          return url;
        }

        // Remove trailing punctuation from URL
        const cleanUrl = url.replace(/[.,;!?]{0,5}$/, '');
        const trailingPunct = url.slice(cleanUrl.length);

        if (fullLinkFormat) {
          return `[${cleanUrl}](${cleanUrl})${trailingPunct}`;
        } else {
          return `<${cleanUrl}>${trailingPunct}`;
        }
      });
    } else {
      // More careful processing when existing links are present
      // Find all existing links and their positions
      linkRegex.lastIndex = 0; // Reset regex
      const links = [];
      let match;
      let loopCount = 0;
      const maxLoops = 1000; // Prevent infinite loops
      while ((match = linkRegex.exec(text)) !== null && loopCount < maxLoops) {
        links.push({
          start: match.index,
          end: match.index + match[0].length,
          fullMatch: match[0]
        });
        loopCount++;
      }

      // Process text in chunks, avoiding existing links
      let processedResult = '';
      let lastIndex = 0;

      for (const linkInfo of links) {
        // Process text before this link
        const beforeLink = text.substring(lastIndex, linkInfo.start);
        processedResult += beforeLink.replace(urlRegex, (url, offsetInBefore) => {
          // offsetInBefore is relative to beforeLink; compute absolute offset in original text
          const absoluteOffset = lastIndex + (offsetInBefore || 0);
          // If the URL is already wrapped in '<' '>' then leave it untouched
          const beforeChar = absoluteOffset > 0 ? text[absoluteOffset - 1] : undefined;
          const afterChar = text[absoluteOffset + url.length];
          if (beforeChar === '<' && afterChar === '>') {
            return url;
          }

          // Remove trailing punctuation from URL
          const cleanUrl = url.replace(/[.,;!?]{0,5}$/, '');
          const trailingPunct = url.slice(cleanUrl.length);

          if (fullLinkFormat) {
            return `[${cleanUrl}](${cleanUrl})${trailingPunct}`;
          } else {
            return `<${cleanUrl}>${trailingPunct}`;
          }
        });

        // Add the existing link unchanged
        processedResult += linkInfo.fullMatch;
        lastIndex = linkInfo.end;
      }

      // Process remaining text after the last link
      const afterLastLink = text.substring(lastIndex);
      processedResult += afterLastLink.replace(urlRegex, (url, offsetInAfter) => {
        const absoluteOffset = lastIndex + (offsetInAfter || 0);
        const beforeChar = absoluteOffset > 0 ? text[absoluteOffset - 1] : undefined;
        const afterChar = text[absoluteOffset + url.length];
        if (beforeChar === '<' && afterChar === '>') {
          return url;
        }

        // Remove trailing punctuation from URL
        const cleanUrl = url.replace(/[.,;!?]{0,5}$/, '');
        const trailingPunct = url.slice(cleanUrl.length);

        if (fullLinkFormat) {
          return `[${cleanUrl}](${cleanUrl})${trailingPunct}`;
        } else {
          return `<${cleanUrl}>${trailingPunct}`;
        }
      });

      result = processedResult;
    }

    return Buffer.from(result);
  }

  private transformList(input: ReadableContent): ReadableContent {
    if (!input || input.length === 0) return input;

    const lines = input.toString().split(/\r?\n/);
    const transformedLines: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trimStart();

      // Check for unordered list item
      const isUnordered = /^[-*+]\s+/.test(trimmedLine);
      // Check for ordered list item
      const isOrdered = /^\d+\.\s+/.test(trimmedLine);

      if (isUnordered || isOrdered) {
        // Start/continue a list
        inList = true;
        transformedLines.push(line); // Keep original indentation
        continue;
      }

      if (inList) {
        // Empty line ends the list
        if (line.trim() === '') {
          inList = false;
          transformedLines.push(line);
          continue;
        }

        // Already-indented continuation: keep as-is
        if (line.startsWith(' ') || line.startsWith('\t')) {
          transformedLines.push(line);
          continue;
        }

        // Non-indented, non-empty line after a list item: treat as continuation and indent by two spaces
        transformedLines.push('  ' + line);
        // remain inList so multiple consecutive continuation lines get indented
        continue;
      }

      // Not in a list
      transformedLines.push(line);
    }

    return Buffer.from(transformedLines.join('\n'));
  }

  /**
   * Trim trailing CR/LF bytes from a buffer.
   * Returns a buffer that ends with exactly one LF ("\n").
   * If the input is empty or contains only newlines, returns a buffer with a single "\n".
   */
  private trimTrailingLineBreaks(input: ReadableContent): ReadableContent {
    if (!input || input.length === 0) {
      return this.lineBreak();
    }

    let end = input.length - 1;
    while (end >= 0 && (input[end] === 0x0A /* \n */ || input[end] === 0x0D /* \r */)) {
      end--;
    }

    if (end < 0) {
      return this.lineBreak();
    }

    const contentPart = input.subarray(0, end + 1);
    return this.appendContent(contentPart, this.lineBreak());
  }
}
