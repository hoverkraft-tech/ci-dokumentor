import { inject, injectable } from 'inversify';
import { FormatterLanguage } from '../formatter-language.js';
import { FormatterAdapter, FormatterOptions, LinkFormat } from '../formatter.adapter.js';
import { SectionIdentifier } from '../../generator/section/section-generator.adapter.js';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownTableGenerator } from './markdown-table.generator.js';
import { MarkdownLinkGenerator } from './markdown-link.generator.js';
import { MarkdownCodeGenerator } from './markdown-code.generator.js';

@injectable()
export class MarkdownFormatterAdapter implements FormatterAdapter {
  private options: FormatterOptions = {
    linkFormat: LinkFormat.Auto
  };

  constructor(
    @inject(MarkdownTableGenerator) private readonly markdownTableGenerator: MarkdownTableGenerator,
    @inject(MarkdownLinkGenerator) private readonly markdownLinkGenerator: MarkdownLinkGenerator,
    @inject(MarkdownCodeGenerator) private readonly markdownCodeGenerator: MarkdownCodeGenerator
  ) {
  }

  setOptions(options: FormatterOptions): void {
    this.options = { ...options };
  }

  supportsLanguage(language: FormatterLanguage): boolean {
    return language === FormatterLanguage.Markdown;
  }

  heading(content: ReadableContent, level = 1): ReadableContent {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    // Enhanced: Use instance method with direct string support
    return new ReadableContent(`${hashes} `).append(content, this.lineBreak());
  }

  center(content: ReadableContent): ReadableContent {
    // Trim leading/trailing whitespace/newlines
    content = content.trim();

    let result = new ReadableContent('<div align="center">');

    if (!content.isEmpty()) {
      const lines = content.splitLines();
      // Add line break before and after the content, and indent non-empty lines
      result = result.append(this.lineBreak());
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].isEmpty()) {
          // Append the trimmed line. Add a newline after the line except
          // for the last one to avoid introducing an extra blank line.
          result = result.append('  ', lines[i].trim());
          if (i < lines.length - 1) {
            result = result.append(this.lineBreak());
          }
        }
      }
      // Ensure the last content line is followed by a newline so the closing
      // tag appears on its own line.
      result = result.append(this.lineBreak());
    }

    result = result.append('</div>', this.lineBreak());

    return result;
  }

  paragraph(content: ReadableContent): ReadableContent {
    const linkFormat = this.options.linkFormat;
    let processedInput = linkFormat && linkFormat !== LinkFormat.None
      ? this.markdownLinkGenerator.transformUrls(content, linkFormat === LinkFormat.Full)
      : content;

    processedInput = this.transformList(processedInput);

    return processedInput.append(this.lineBreak());
  }

  bold(content: ReadableContent): ReadableContent {
    // Enhanced: Use instance method with direct string support
    return new ReadableContent('**').append(content.escape('**'), '**');
  }

  italic(input: ReadableContent): ReadableContent {
    // Enhanced: Use instance method with direct string support
    return new ReadableContent('*').append(input.escape('*'), '*');
  }

  code(content: ReadableContent, language?: ReadableContent): ReadableContent {
    const fence = this.markdownCodeGenerator.backtickFenceFor(content);
    return fence.append(
      language || ReadableContent.empty(),
      this.lineBreak(),
      content.trim(),
      this.lineBreak(),
      fence,
      this.lineBreak(),
    );
  }

  inlineCode(content: ReadableContent): ReadableContent {
    return ReadableContent.empty().append(
      '`',
      content.escape(['`', '*']),
      '`'
    );
  }

  link(text: ReadableContent, url: ReadableContent): ReadableContent {
    // If the text is already a single inline markdown link or image (e.g. "![...](...)" or "[...]()"),
    // don't escape it - callers sometimes pass pre-formatted markdown (badges) as the link text.
    const isInlineMarkdown = this.contentLooksLikeInlineMarkdown(text);
    // Enhanced: Use instance method with direct string support
    return new ReadableContent('[')
      .append(
        isInlineMarkdown ? text : text.escape(['[', ']']),
        '](',
        url.escape(')'),
        ')'
      );
  }

  image(
    url: ReadableContent,
    altText: ReadableContent,
    options?: { width?: string; align?: string }
  ): ReadableContent {
    if (options?.width || options?.align) {
      let result = new ReadableContent('<img src="').append(url, new ReadableContent('"'));
      // Use HTML img tag for advanced formatting (buffer-based)
      if (options.width) {
        result = result.append(` width="${options.width}"`);
      }
      if (options.align) {
        result = result.append(` align="${options.align}"`);
      }

      result = result.append(
        ` alt="`,
        altText.escape(['[', ']']),
        `" />`
      );

      return result;
    }

    return new ReadableContent('![').append(
      altText.escape(['[', ']']),
      new ReadableContent(']('),
      url.escape(['[', ']']),
      new ReadableContent(')')
    );
  }

  table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent {
    return this.markdownTableGenerator.table(headers, rows);
  }

  badge(label: ReadableContent, url: ReadableContent): ReadableContent {
    return ReadableContent.empty().append(
      '![',
      label.escape(['*', ')']),
      '](',
      url.escape(['*', ')']),
      ')'
    );
  }

  list(items: ReadableContent[], ordered = false): ReadableContent {
    if (items.length === 0) {
      return ReadableContent.empty();
    }

    let result = ReadableContent.empty();
    for (let i = 0; i < items.length; i++) {
      const prefix = ordered ? `${i + 1}. ` : '- ';
      result = result.append(prefix, items[i], this.lineBreak());
    }
    return result;
  }

  horizontalRule(): ReadableContent {
    return new ReadableContent('---').append(this.lineBreak());
  }

  lineBreak(): ReadableContent {
    return new ReadableContent('\n');
  }

  section(section: SectionIdentifier, content: ReadableContent): ReadableContent {
    const startMarker = this.sectionStart(section);
    const endMarker = this.sectionEnd(section);

    if (content.isEmpty()) {
      return ReadableContent.empty().append(
        startMarker,
        this.lineBreak(),
        endMarker,
        this.lineBreak()
      );
    }

    return startMarker.append(
      this.lineBreak(),
      this.lineBreak(),
      content.trim(),
      this.lineBreak(),
      this.lineBreak(),
      endMarker,
      this.lineBreak()
    );
  }

  sectionStart(section: SectionIdentifier): ReadableContent {
    return new ReadableContent('<!-- ').append(
      new ReadableContent(section).escape(['<!--', '-->']),
      new ReadableContent(':start -->')
    );
  }

  sectionEnd(section: SectionIdentifier): ReadableContent {
    return new ReadableContent('<!-- ').append(
      new ReadableContent(section).escape(['<!-- ', '-->']),
      new ReadableContent(':end -->')
    );
  }

  /**
   * Quick heuristic to check if a buffer looks like a single inline markdown link/image
   * (e.g. "[text](url)" or "![alt](url)"), ignoring surrounding whitespace.
   */
  private contentLooksLikeInlineMarkdown(content: ReadableContent): boolean {
    if (content.isEmpty()) {
      return false;
    }

    return content.test(/^\s*!?\[[^\]]*\]\([^)]*\)\s*$/);
  }


  private transformList(content: ReadableContent): ReadableContent {
    if (content.isEmpty()) {
      return content;
    }
    let transformedLines = ReadableContent.empty();
    let inList = false;
    // Determine whether the content starts inside a code fence by inspecting
    // the full buffer. This uses the MarkdownCodeGenerator helper.
    let inCodeFence = false;

    const lines = content.splitLines();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trimStart();

      // Detect start/end of fenced code block using the code generator helper
      if (this.markdownCodeGenerator.isFenceLine(trimmedLine)) {
        // Toggle code fence state and always append the fence line as-is
        inCodeFence = !inCodeFence;
        transformedLines = transformedLines.append(line);
        if (i < lines.length - 1) {
          transformedLines = transformedLines.append(this.lineBreak());
        }
        continue;
      }

      // While inside a fenced code block, preserve lines exactly
      if (inCodeFence) {
        transformedLines = transformedLines.append(line);
        if (i < lines.length - 1) {
          transformedLines = transformedLines.append(this.lineBreak());
        }
        continue;
      }

      // Check for unordered list item
      const isUnordered = trimmedLine.test(/^[-*+]\s+/);
      // Check for ordered list item
      const isOrdered = trimmedLine.test(/^\d+\.\s+/);

      if (isUnordered || isOrdered) {
        // Start/continue a list
        inList = true;
        transformedLines = transformedLines.append(line);
        if (i < lines.length - 1) {
          transformedLines = transformedLines.append(this.lineBreak());
        }
        continue;
      }

      if (inList) {
        // Empty line ends the list
        if (line.trim().isEmpty()) {
          inList = false;
          transformedLines = transformedLines.append(line);
          if (i < lines.length - 1) {
            transformedLines = transformedLines.append(this.lineBreak());
          }
          continue;
        }

        // Already-indented continuation: keep as-is
        if (line.startsWith(' ') || line.startsWith('\t')) {
          transformedLines = transformedLines.append(line);
          if (i < lines.length - 1) {
            transformedLines = transformedLines.append(this.lineBreak());
          }
          continue;
        }

        // Non-indented, non-empty line after a list item: treat as continuation and indent by two spaces
        transformedLines = transformedLines.append('  ', line);
        if (i < lines.length - 1) {
          transformedLines = transformedLines.append(this.lineBreak());
        }
        // remain inList so multiple consecutive continuation lines get indented
        continue;
      }

      // Not in a list
      transformedLines = transformedLines.append(line);
      if (i < lines.length - 1) {
        transformedLines = transformedLines.append(this.lineBreak());
      }
    }

    return transformedLines;
  }

}
