import { FormatterLanguage } from './formatter-language.js';
import { FormatterAdapter } from './formatter.adapter.js';

export class MarkdownFormatterAdapter implements FormatterAdapter {
  supportsLanguage(language: FormatterLanguage): boolean {
    return language === FormatterLanguage.Markdown;
  }

  appendContent(...parts: Buffer[]): Buffer {
    // Fast single-allocation concatenation. Convert string parts to buffers and copy into
    // a pre-allocated Buffer to avoid multiple intermediate allocations from Buffer.concat.
    if (!parts || parts.length === 0) return Buffer.alloc(0);

    // First pass: compute total length and normalize buffers lazily
    const buffers: Buffer[] = new Array(parts.length);
    let total = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      buffers[i] = p as Buffer;
      total += buffers[i].length;
    }

    if (buffers.length === 1) return buffers[0];

    const out = Buffer.allocUnsafe(total);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      const b = buffers[i];
      if (b.length === 0) continue;
      b.copy(out, offset);
      offset += b.length;
    }
    return out;
  }

  heading(input: Buffer, level = 1): Buffer {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return this.appendContent(Buffer.from(`${hashes} `), input, this.lineBreak());
  }

  center(input: Buffer): Buffer {
    // Buffer-based implementation: trim overall, split on LF, indent non-empty lines
    const lb = 0x0A; // \n
    // Trim leading/trailing whitespace/newlines
    let start = 0;
    let end = input.length - 1;
    while (start <= end && (input[start] === 0x20 /* space */ || input[start] === 0x09 /* tab */ || input[start] === 0x0A /* LF */ || input[start] === 0x0D /* CR */)) start++;
    while (end >= start && (input[end] === 0x20 /* space */ || input[end] === 0x09 /* tab */ || input[end] === 0x0A /* LF */ || input[end] === 0x0D /* CR */)) end--;

    const hasContent = end >= start;

    const parts: Buffer[] = [Buffer.from('<div align="center">')];

    if (hasContent) {
      // slice is zero-copy view over the original buffer
      const content = input.subarray(start, end + 1);
      // split on LF (0x0A), preserve lines; handle CR by trimming in each line
      const lines: Buffer[] = [];
      let lineStart = 0;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === lb) {
          const lineBuf = content.subarray(lineStart, i);
          // trim trailing CR from the line
          const l = lineBuf.length > 0 && lineBuf[lineBuf.length - 1] === 0x0D ? lineBuf.subarray(0, lineBuf.length - 1) : lineBuf;
          lines.push(l);
          lineStart = i + 1;
        }
      }
      // last line
      if (lineStart <= content.length - 1) {
        const lineBuf = content.subarray(lineStart, content.length);
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

  comment(input: Buffer): Buffer {
    return this.appendContent(
      Buffer.from(`<!-- `),
      this.escapeComment(input),
      Buffer.from(` -->`),
      this.lineBreak()
    );
  }

  paragraph(input: Buffer): Buffer {
    return this.appendContent(input, this.lineBreak());
  }

  bold(input: Buffer): Buffer {
    return this.appendContent(
      Buffer.from('**'),
      this.escape(input, '**'),
      Buffer.from('**')
    );
  }

  italic(input: Buffer): Buffer {
    return this.appendContent(
      Buffer.from('*'),
      this.escape(input, '*'),
      Buffer.from('*')
    );
  }

  code(input: Buffer, language?: Buffer): Buffer {
    return this.appendContent(
      Buffer.from('```'),
      language || Buffer.alloc(0),
      this.lineBreak(),
      this.trimTrailingNewlines(input),
      Buffer.from('```'),
      this.lineBreak(),
    );
  }

  inlineCode(input: Buffer): Buffer {
    return this.appendContent(
      Buffer.from('`'),
      this.escape(input, '`'),
      Buffer.from('`')
    );
  }

  link(text: Buffer, url: Buffer): Buffer {
    // If the text is already a single inline markdown link or image (e.g. "![...](...)" or "[...]()"),
    // don't escape it - callers sometimes pass pre-formatted markdown (badges) as the link text.
    const isInlineMarkdown = /^\s*!?\[[^\]]*\]\([^)]*\)\s*$/.test(text.toString());
    return this.appendContent(
      Buffer.from('['),
      isInlineMarkdown ? text : this.escape(this.escape(text, '['), ']'),
      Buffer.from(']('),
      this.escape(url, ')'),
      Buffer.from(')')
    );
  }

  image(
    url: Buffer,
    altText: Buffer,
    options?: { width?: string; align?: string }
  ): Buffer {
    if (options?.width || options?.align) {
      // Use HTML img tag for advanced formatting (buffer-based)
      const attributes: Buffer[] = [];
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
        this.escape(this.escape(altText, '['), ']'),
        Buffer.from(`" />`)
      );
      return this.appendContent(...parts);
    }

    return this.appendContent(
      Buffer.from('!['),
      this.escape(this.escape(altText, '['), ']'),
      Buffer.from(']('),
      this.escape(url, ')'),
      Buffer.from(')')
    );
  }

  table(headers: Buffer[], rows: Buffer[][]): Buffer {
    const normalizeCell = (cell: Buffer): Buffer => {
      return this.escape(this.trimBuffer(cell), '|');
    };

    const splitMultilineCell = (cell: Buffer): Buffer[] => {
      return this.splitLines(this.trimBuffer(cell));
    };

    let result = '';

    // If no headers, tests expect an empty string
    const isEmptyTable = (!headers || headers.length === 0) && (!rows || rows.length === 0);
    if (isEmptyTable) {
      return Buffer.alloc(0)
    }

    // Handle multiline content with additional rows and compute column widths
    const headerLines = headers.map(splitMultilineCell);
    const numCols = headers.length;
    const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));

    const colWidths: number[] = Array.from({ length: numCols }, () => 0);

    // consider header lines
    for (let c = 0; c < numCols; c++) {
      (headerLines[c] || ['']).forEach((headerLine) => {
        const cellContent = normalizeCell(Buffer.from(headerLine || ''));
        colWidths[c] = Math.max(colWidths[c], cellContent.length);
      });
    }

    // consider data rows
    rows.forEach((row) => {
      for (let c = 0; c < numCols; c++) {
        const cell = row[c] || Buffer.alloc(0);
        splitMultilineCell(cell).forEach((ln) => {
          const s = normalizeCell(Buffer.from(ln || ''));
          colWidths[c] = Math.max(colWidths[c], s.length);
        });
      }
    });

    const pad = (s: string, width: number) => s + ' '.repeat(Math.max(0, width - s.length));

    // First header row (main headers) — pad to column widths
    const mainHeaderRow = `| ${headers
      .map((h, c) => pad(normalizeCell(splitMultilineCell(h)[0]).toString(), colWidths[c]))
      .join(' | ')} |`;

    // separator uses dashes matching column width (min 3)
    const separatorRow = `| ${colWidths.map((w) => '-'.repeat(Math.max(3, w))).join(' | ')} |`;
    result += `${mainHeaderRow}\n${separatorRow}\n`;

    // Additional header rows if multiline headers exist
    for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
      const additionalHeaderCells = headerLines.map((lines, c) =>
        pad(normalizeCell(lines[lineIndex]).toString(), colWidths[c])
      );
      result += `| ${additionalHeaderCells.join(' | ')} |\n`;
    }

    // Process data rows — normalize to numCols and pad each cell line
    rows.forEach((row) => {
      const normalizedRow: Buffer[] = [];
      for (let c = 0; c < numCols; c++) normalizedRow.push(row[c] || Buffer.alloc(0));

      const cellLines = normalizedRow.map(splitMultilineCell);
      const maxLines = Math.max(...cellLines.map((lines) => lines.length));

      for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
        const outCells: string[] = [];
        for (let c = 0; c < numCols; c++) {
          const lines = cellLines[c] || [''];
          const raw = lines[lineIndex] || '';
          outCells.push(pad(normalizeCell(raw).toString(), colWidths[c]));
        }
        result += `| ${outCells.join(' | ')} |\n`;
      }
    });

    // Use buffer-based trimming to avoid converting the whole table string to JS string
    return this.trimTrailingNewlines(Buffer.from(result));
  }

  badge(label: Buffer, url: Buffer): Buffer {
    return this.appendContent(
      Buffer.from('!['),
      this.escape(this.escape(label, '*'), ')'),
      Buffer.from(']('),
      this.escape(this.escape(url, '*'), ')'),
      Buffer.from(')')
    );
  }

  horizontalRule(): Buffer {
    return this.appendContent(Buffer.from('---'), this.lineBreak());
  }

  lineBreak(): Buffer {
    return Buffer.from('\n');
  }

  /**
   * Escape special characters in the input buffer for markdown.
   */
  private escape(input: Buffer, search: string): Buffer {
    if (!input || input.length === 0) return Buffer.alloc(0);
    if (!search || search.length === 0) return input;

    const searchBuf = Buffer.from(search);
    // Build replacement buffer: prefix each character with backslash
    const replaceStr = search.split('').map((c) => '\\' + c).join('');
    const replaceBuf = Buffer.from(replaceStr);

    const parts: Buffer[] = [];
    let idx = 0;
    let found = input.indexOf(searchBuf, idx);
    while (found !== -1) {
      if (found > idx) parts.push(input.subarray(idx, found));
      parts.push(replaceBuf);
      idx = found + searchBuf.length;
      found = input.indexOf(searchBuf, idx);
    }
    if (idx < input.length) parts.push(input.subarray(idx));

    if (parts.length === 0) return Buffer.alloc(0);
    if (parts.length === 1) return parts[0];
    return this.appendContent(...parts);
  }

  /**
   * Escape comment-specific sequences in the input buffer for markdown.
   * Escape standalone closing sequences "-->" to avoid prematurely ending the outer comment,
   * but do not escape occurrences that are the closing partner of an explicit opening "<!--" inside
   * the content (e.g. when input contains a literal "<!-- ... -->" snippet we keep it).
   */
  private escapeComment(input: Buffer): Buffer {
    const closeBuf = Buffer.from('-->');
    const openBuf = Buffer.from('<!--');
    const parts: Buffer[] = [];
    let idx = 0;
    let nextClose = input.indexOf(closeBuf, idx);
    while (nextClose !== -1) {
      // find last '<!--' before nextClose
      const lastOpen = input.lastIndexOf(openBuf, nextClose);
      if (lastOpen !== -1) {
        const interveningClose = input.indexOf(closeBuf, lastOpen);
        if (interveningClose === nextClose) {
          // keep the whole region including this close unescaped
          if (nextClose + 3 > idx) parts.push(input.subarray(idx, nextClose + 3));
          idx = nextClose + 3;
          nextClose = input.indexOf(closeBuf, idx);
          continue;
        }
      }
      // otherwise escape this close
      if (nextClose > idx) parts.push(input.subarray(idx, nextClose));
      parts.push(Buffer.from('--\\>'));
      idx = nextClose + 3;
      nextClose = input.indexOf(closeBuf, idx);
    }
    if (idx < input.length) parts.push(input.subarray(idx));
    if (parts.length === 0) return Buffer.alloc(0);
    if (parts.length === 1) return parts[0];
    return this.appendContent(...parts);
  }

  /**
   * Trim trailing CR/LF bytes from a buffer.
   * Returns a buffer that ends with exactly one LF ("\n").
   * If the input is empty or contains only newlines, returns a buffer with a single "\n".
   */
  private trimTrailingNewlines(buf: Buffer): Buffer {
    if (!buf || buf.length === 0) return this.lineBreak();
    let end = buf.length - 1;
    while (end >= 0 && (buf[end] === 0x0A /* \n */ || buf[end] === 0x0D /* \r */)) end--;
    if (end < 0) return this.lineBreak();
    const contentPart = buf.subarray(0, end + 1);
    return this.appendContent(contentPart, this.lineBreak());
  }

  /**
   * Trim leading/trailing spaces, tabs, CR/LF from buffer. Returns sliced buffer view.
   */
  private trimBuffer(input: Buffer): Buffer {
    if (!input || input.length === 0) {
      return Buffer.alloc(0);
    }

    let start = 0;
    let end = input.length - 1;
    const isWhitespace = (b: number) => b === 0x20 /* space */ || b === 0x09 /* tab */ || b === 0x0A /* LF */ || b === 0x0D /* CR */;
    while (start <= end && isWhitespace(input[start])) {
      start++;
    }
    while (end >= start && isWhitespace(input[end])) {
      end--;
    }
    if (end < start) {
      return Buffer.alloc(0);
    }
    return input.subarray(start, end + 1);
  }

  /**
   * Split buffer into lines on LF
   *
   * @param input
   * @returns an array of Buffers, each line without trailing CR.
   */
  private splitLines(input: Buffer): Buffer[] {
    if (!input || input.length === 0) return [Buffer.alloc(0)];
    const lines: Buffer[] = [];
    let lineStart = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === 0x0A /* LF */) {
        let line = input.subarray(lineStart, i);
        if (line.length > 0 && line[line.length - 1] === 0x0D) {
          line = line.subarray(0, line.length - 1);
        }
        lines.push(line);
        lineStart = i + 1;
      }
    }
    // last line
    if (lineStart <= input.length - 1) {
      let line = input.subarray(lineStart, input.length);
      if (line.length > 0 && line[line.length - 1] === 0x0D) {
        line = line.subarray(0, line.length - 1);
      }
      lines.push(line);
    } else if (lineStart === input.length) {
      // trailing newline, add empty final line
      lines.push(Buffer.alloc(0));
    }
    return lines;
  }
}
