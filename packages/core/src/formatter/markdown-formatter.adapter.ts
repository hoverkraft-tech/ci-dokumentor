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
      Buffer.from(`\`\`\``),
      this.lineBreak(),
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

  table(headers: Buffer[], rows: Buffer[][]): Buffer {
    const normalizeCell = (cell: Buffer): string => {
      return cell.toString().replace(/\|/g, '\\|');
    };

    const splitMultilineCell = (cell: Buffer): string[] => {
      return cell.toString().split('\n');
    };
    let result = '';

    // If no headers, tests expect an empty string
    if (!headers || headers.length === 0) return Buffer.from('');

    // Handle multiline content with additional rows and compute column widths
    const headerLines = headers.map(splitMultilineCell);
    const numCols = headers.length;
    const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));

    const colWidths: number[] = Array.from({ length: numCols }, () => 0);

    // consider header lines
    for (let c = 0; c < numCols; c++) {
      (headerLines[c] || ['']).forEach((ln) => {
        const s = normalizeCell(Buffer.from(ln || ''));
        colWidths[c] = Math.max(colWidths[c], s.length);
      });
    }

    // consider data rows
    rows.forEach((row) => {
      for (let c = 0; c < numCols; c++) {
        const cell = row[c] || Buffer.from('');
        splitMultilineCell(cell).forEach((ln) => {
          const s = normalizeCell(Buffer.from(ln || ''));
          colWidths[c] = Math.max(colWidths[c], s.length);
        });
      }
    });

    const pad = (s: string, width: number) => s + ' '.repeat(Math.max(0, width - s.length));

    // First header row (main headers) — pad to column widths
    const mainHeaderRow = `| ${headers
      .map((h, c) => pad(normalizeCell(Buffer.from(splitMultilineCell(h)[0] || '')), colWidths[c]))
      .join(' | ')} |`;

    // separator uses dashes matching column width (min 3)
    const separatorRow = `| ${colWidths.map((w) => '-'.repeat(Math.max(3, w))).join(' | ')} |`;
    result += `${mainHeaderRow}\n${separatorRow}\n`;

    // Additional header rows if multiline headers exist
    for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
      const additionalHeaderCells = headerLines.map((lines, c) =>
        pad(normalizeCell(Buffer.from(lines[lineIndex] || '')), colWidths[c])
      );
      result += `| ${additionalHeaderCells.join(' | ')} |\n`;
    }

    // Process data rows — normalize to numCols and pad each cell line
    rows.forEach((row) => {
      const normalizedRow: Buffer[] = [];
      for (let c = 0; c < numCols; c++) normalizedRow.push(row[c] || Buffer.from(''));

      const cellLines = normalizedRow.map(splitMultilineCell);
      const maxLines = Math.max(...cellLines.map((lines) => lines.length));

      for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
        const outCells: string[] = [];
        for (let c = 0; c < numCols; c++) {
          const lines = cellLines[c] || [''];
          const raw = lines[lineIndex] || '';
          outCells.push(pad(normalizeCell(Buffer.from(raw)), colWidths[c]));
        }
        result += `| ${outCells.join(' | ')} |\n`;
      }
    });

    return Buffer.concat([Buffer.from(result.trimEnd()), this.lineBreak()]);
  }

  badge(label: Buffer, url: Buffer): Buffer {
    return Buffer.from(`![${label.toString()}](${url.toString()})`);
  }

  horizontalRule(): Buffer {
    return Buffer.concat([this.lineBreak(), Buffer.from('---'), this.lineBreak()]);
  }

  lineBreak(): Buffer {
    return Buffer.from('\n');
  }
}
