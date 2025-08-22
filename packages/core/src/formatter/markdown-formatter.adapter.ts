import { FormatterLanguage } from './formatter-language.js';
import { FormatterAdapter } from './formatter.adapter.js';

export class MarkdownFormatterAdapter implements FormatterAdapter {
  supportsLanguage(language: FormatterLanguage): boolean {
    return language === FormatterLanguage.Markdown;
  }

  heading(input: Buffer, level = 1): Buffer {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return Buffer.concat([
      Buffer.from(`${hashes} `),
      input,
      this.lineBreak()
    ]);
  }

  center(input: Buffer): Buffer {
    const lineBreak = this.lineBreak().toString();
    const indentedInput = input.toString().trim()
      .split(lineBreak)
      .map(line => line.length ? `  ${line}` : ``)
      .join(lineBreak);

    return Buffer.concat([
      Buffer.from(`<div align="center">`),
      ...(indentedInput.length ? [this.lineBreak(), Buffer.from(indentedInput), this.lineBreak(),] : []),
      Buffer.from(`</div>`),
      this.lineBreak(),
    ]);
  }

  comment(input: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`<!-- `),
      input,
      Buffer.from(` -->`),
      this.lineBreak()
    ]);
  }

  paragraph(input: Buffer): Buffer {
    return Buffer.concat([
      input,
      this.lineBreak()
    ]);
  }

  bold(input: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`**`),
      input,
      Buffer.from(`**`)
    ]);
  }

  italic(input: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`*`),
      input,
      Buffer.from(`*`)
    ]);
  }

  code(input: Buffer, language?: Buffer): Buffer {
    const lang = language || Buffer.from('');
    return Buffer.concat([
      Buffer.from(`\`\`\``),
      lang,
      this.lineBreak(),
      input,
      this.lineBreak(),
      Buffer.from(`\`\`\``)
    ]);
  }

  inlineCode(input: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`\``),
      input,
      Buffer.from(`\``)
    ]);
  }

  link(text: Buffer, url: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`[`),
      text,
      Buffer.from(`](`),
      url,
      Buffer.from(`)`)
    ]);
  }

  image(
    url: Buffer,
    altText: Buffer,
    options?: { width?: string; align?: string }
  ): Buffer {
    if (options?.width || options?.align) {
      // Use HTML img tag for advanced formatting
      const attributes = [];
      if (options.width) attributes.push(`width="${options.width}"`);
      if (options.align) attributes.push(`align="${options.align}"`);
      const attributeStr =
        attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
      return Buffer.from(
        `<img src="${url.toString()}"${attributeStr} alt="${altText.toString()}" />`
      );
    }

    return Buffer.concat([
      Buffer.from(`![`),
      altText,
      Buffer.from(`](`),
      url,
      Buffer.from(`)`)
    ]);
  }

  list(items: Buffer[], ordered = false): Buffer {
    const prefix = ordered ? '1. ' : '- ';
    const listItems = items
      .map((item, index) => {
        const actualPrefix = ordered ? `${index + 1}. ` : prefix;
        return `${actualPrefix}${item.toString()}`;
      })
      .join('\n');
    return Buffer.from(listItems);
  }

  table(headers: Buffer[], rows: Buffer[][]): Buffer {
    const normalizeCell = (cell: Buffer): string => {
      return cell.toString().replace(/\|/g, '\\|');
    };

    const splitMultilineCell = (cell: Buffer): string[] => {
      return cell.toString().split('\n');
    };

    let result = '';

    // Handle multiline content with additional rows
    const headerLines = headers.map(splitMultilineCell);
    const maxHeaderLines = Math.max(
      ...headerLines.map((lines) => lines.length)
    );

    // First header row (main headers)
    const mainHeaderRow = `| ${headers
      .map((h) => normalizeCell(Buffer.from(splitMultilineCell(h)[0] || '')))
      .join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    result += `${mainHeaderRow}\n${separatorRow}\n`;

    // Additional header rows if multiline headers exist
    for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
      const additionalHeaderCells = headerLines.map((lines) =>
        normalizeCell(Buffer.from(lines[lineIndex] || ''))
      );
      result += `| ${additionalHeaderCells.join(' | ')} |\n`;
    }

    // Process data rows
    rows.forEach((row) => {
      const cellLines = row.map(splitMultilineCell);
      const maxLines = Math.max(...cellLines.map((lines) => lines.length));

      // First line of the row (main content)
      const mainRowCells = cellLines.map((lines) =>
        normalizeCell(Buffer.from(lines[0] || ''))
      );
      result += `| ${mainRowCells.join(' | ')} |\n`;

      // Additional lines for multiline content
      for (let lineIndex = 1; lineIndex < maxLines; lineIndex++) {
        const additionalCells = cellLines.map((lines) =>
          normalizeCell(Buffer.from(lines[lineIndex] || ''))
        );
        result += `| ${additionalCells.join(' | ')} |\n`;
      }
    });

    return Buffer.from(result.trimEnd());
  }

  badge(label: Buffer, url: Buffer): Buffer {
    return Buffer.from(`![${label.toString()}](${url.toString()})`);
  }

  blockquote(input: Buffer): Buffer {
    const lines = input.toString().split(this.lineBreak().toString());
    const quotedLines = lines.map((line) => [
      Buffer.from(`> ${line}`),
      this.lineBreak()
    ]).flat();
    return Buffer.concat(quotedLines);
  }

  details(summary: Buffer, content: Buffer): Buffer {
    return Buffer.from(
      `<details>\n<summary>${summary.toString()}</summary>\n\n${content.toString()}\n\n</details>`
    );
  }

  lineBreak(): Buffer {
    return Buffer.from('\n');
  }

  horizontalRule(): Buffer {
    return Buffer.from('---');
  }
}
