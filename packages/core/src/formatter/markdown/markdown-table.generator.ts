import { inject, injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownCodeGenerator } from './markdown-code.generator.js';

/**
 * Class responsible for generating markdown tables from headers and rows.
 * Self-contained: implements the small set of helpers needed to render tables.
 */
@injectable()
export class MarkdownTableGenerator {
    constructor(
        @inject(MarkdownCodeGenerator) private readonly markdownCodeGenerator: MarkdownCodeGenerator
    ) {
    }

    table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent {
        const isEmptyTable = (!headers || headers.length === 0) && (!rows || rows.length === 0);
        if (isEmptyTable) {
            return ReadableContent.empty();
        }

        const headerLines = headers.map((h) => this.splitMultilineCell(h));
        const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));

        const colWidths = this.computeColWidths(headers, rows, headerLines);
        return this.renderTable(headers, rows, headerLines, colWidths, maxHeaderLines);
    }

    /**
     * Normalize a cell for measurement and output escaping pipe characters.
     */
    private normalizeCell(cell: ReadableContent): ReadableContent {
        return cell.trim().escape('|');
    }

    private computeColWidths(
        headers: ReadableContent[],
        rows: ReadableContent[][],
        headerLines: ReadableContent[][]
    ): number[] {
        const numCols = headers.length;
        const colWidths: number[] = Array.from({ length: numCols }, () => 0);
        for (let c = 0; c < numCols; c++) {
            const hLines = headerLines[c] || [ReadableContent.empty()];
            for (const hl of hLines) {
                const line = hl || ReadableContent.empty();
                const tb = this.transformTableCellLine(line);
                const normalizedCell = this.normalizeCell(tb || ReadableContent.empty());
                colWidths[c] = Math.max(colWidths[c], normalizedCell.getSize());
            }
        }

        for (const row of rows) {
            for (let c = 0; c < numCols; c++) {
                const clines = this.splitMultilineCell(row[c] || ReadableContent.empty());
                for (const ln of clines) {
                    const line = ln || ReadableContent.empty();
                    const tb = this.transformTableCellLine(line);
                    const norm = this.normalizeCell(tb || ReadableContent.empty());
                    colWidths[c] = Math.max(colWidths[c], norm.getSize());
                }
            }
        }

        return colWidths;
    }

    private renderTable(
        headers: ReadableContent[],
        rows: ReadableContent[][],
        headerLines: ReadableContent[][],
        colWidths: number[],
        maxHeaderLines: number
    ): ReadableContent {
        const numCols = headers.length;

        let content = new ReadableContent('| ');

        // main header (first header line)
        for (let c = 0; c < numCols; c++) {
            const first = (headerLines[c] && headerLines[c][0]) || ReadableContent.empty();
            const tb = this.transformTableCellLine(first);

            const cell = this.padCell(tb, colWidths[c]);
            if (c > 0) {
                content = content.append(' | ');
            }
            content = content.append(cell);
        }

        // Close the header row with a trailing pipe and then append the separator line beneath it.
        content = content.append(' |');
        content = content.append(
            this.lineBreak(),
            `| ${colWidths.map((w) => '-'.repeat(Math.max(3, w))).join(' | ')} |`,
            this.lineBreak()
        );

        // Additional header lines
        for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
            content = content.append('| ');

            for (let c = 0; c < numCols; c++) {
                const hl = (headerLines[c] && headerLines[c][lineIndex]) || ReadableContent.empty();
                const tb = this.transformTableCellLine(hl);

                const cell = this.padCell(tb, colWidths[c]);
                if (c > 0) {
                    content = content.append(' | ');
                }
                content = content.append(cell);
            }

            content = content.append(' |', this.lineBreak());
        }

        // rows
        for (const row of rows) {
            content = this.renderRow(numCols, row, colWidths, content);
        }

        return content;
    }

    private renderRow(
        numCols: number,
        row: ReadableContent[],
        colWidths: number[],
        content: ReadableContent
    ): ReadableContent {
        const cellLines = [] as ReadableContent[][];
        for (let c = 0; c < numCols; c++) {
            const lines = this.splitMultilineCell(row[c] || ReadableContent.empty());
            const tlines = lines.map(
                (line) => (
                    this.transformTableCellLine(line || ReadableContent.empty())
                )
            );
            cellLines.push(tlines as ReadableContent[]);
        }

        const maxLines = Math.max(...cellLines.map((l) => l.length));
        for (let li = 0; li < maxLines; li++) {
            content = content.append('| ');

            for (let c = 0; c < numCols; c++) {
                const lines = cellLines[c];
                const tb = (lines && lines[li]) || ReadableContent.empty();
                const cell = this.padCell(tb, colWidths[c]);

                if (c > 0) {
                    content = content.append(' | ');
                }
                content = content.append(cell);
            }
            content = content.append(
                ` |`,
                this.lineBreak()
            );
        }
        return content;
    }

    private padCell(content: ReadableContent, width: number): ReadableContent {
        // Normalize and escape pipes, then pad to the requested width by
        // appending the exact number of spaces. We avoid calling
        // ReadableContent.padEnd here to prevent differing behaviors across
        // ReadableContent implementations; this keeps padding explicit and
        // deterministic for table rendering.
        const normalized = this.normalizeCell(content);
        const size = normalized.getSize();
        if (size >= width) {
            return normalized;
        }
        const padCount = Math.max(0, width - size);
        return normalized.padEnd(padCount, ' ');
    }

    private transformTableCellLine(line: ReadableContent): ReadableContent {
        if (!this.shouldRenderHtmlPreForMultilineCode(line)) {
            return line;
        }

        return this.transformLineForFence(line);
    }

    private lineBreak(): ReadableContent {
        return new ReadableContent(String.fromCharCode(ReadableContent.NEW_LINE_CHAR_CODE));
    }

    private splitMultilineCell(content: ReadableContent): ReadableContent[] {
        content = content.trim();
        if (content.isEmpty()) {
            return [ReadableContent.empty()];
        }

        // Use the buffer-based fenced block finder first (safe, linear scan).
        const fenced = this.markdownCodeGenerator.findCodeBlocks(content);
        // Find inline backtick spans (one or more backticks) outside fenced blocks.
        const inlineSpans = this.markdownCodeGenerator.findInlineCode(content, fenced);

        const codeBlocks: { start: number; end: number; replacement: string }[] = [];
        for (const b of fenced) {
            codeBlocks.push({ start: b.start, end: b.end, replacement: `__CODEBLOCK_${codeBlocks.length}__` });
        }
        for (const s of inlineSpans) {
            // skip inline spans that are inside already collected blocks
            if (codeBlocks.some((b) => s.start >= b.start && s.start < b.end)) continue;
            codeBlocks.push({ start: s.start, end: s.end, replacement: `__CODEBLOCK_${codeBlocks.length}__` });
        }

        if (codeBlocks.length === 0) {
            return content.splitLines();
        }

        let modifiedStr = content;
        const order = codeBlocks.map((_, idx) => idx).sort((a, b) => codeBlocks[a].start - codeBlocks[b].start);
        for (let k = order.length - 1; k >= 0; k--) {
            const i = order[k];
            const block = codeBlocks[i];
            modifiedStr = modifiedStr.slice(0, block.start).append(block.replacement).append(modifiedStr.slice(block.end));
        }

        const lines = new ReadableContent(modifiedStr).splitLines();
        const restoredLines: ReadableContent[] = [];
        for (const line of lines) {
            let restoredLine = line;
            for (let i = 0; i < codeBlocks.length; i++) {
                const placeholder = codeBlocks[i].replacement;
                if (restoredLine.includes(placeholder)) {
                    const originalCodeBlock = content.slice(codeBlocks[i].start, codeBlocks[i].end);
                    restoredLine = restoredLine.replace(placeholder, originalCodeBlock);
                }
            }
            restoredLines.push(restoredLine);
        }

        return restoredLines;
    }

    private transformLineForFence(lineBuf: ReadableContent): ReadableContent {
        const segments = this.splitCellIntoSegments(lineBuf);
        if (segments.length === 0) {
            return ReadableContent.empty();
        }

        let result = ReadableContent.empty();
        for (const seg of segments) {
            if (seg.type === 'text') {
                const trimmedContent = seg.content.trim();
                if (!trimmedContent.isEmpty()) {
                    result = result.append(trimmedContent.htmlEscape());
                }
            } else {
                result = result.append(this.markdownCodeGenerator.codeBlock(seg.content, seg.lang, true));
            }
        }

        return result;
    }

    private shouldRenderHtmlPreForMultilineCode(content: ReadableContent): boolean {
        if (content.isEmpty()) {
            return false;
        }

        const blocks = this.markdownCodeGenerator.findCodeBlocks(content);
        if (blocks.length > 0) {
            return true;
        }

        return false;
    }

    private splitCellIntoSegments(cell: ReadableContent): Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: ReadableContent }> {
        const out: Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: ReadableContent }> = [];

        if (cell.isEmpty()) {
            return out;
        }

        const blocks = this.markdownCodeGenerator.findCodeBlocks(cell);
        // If no fenced blocks found, also try to detect inline backtick spans and
        // treat them as code segments. This mirrors fenced block handling so that
        // inline code spans with newlines are rendered as <pre> in tables.
        if (blocks.length === 0) {
            const spans = this.markdownCodeGenerator.findInlineCode(cell, []);
            if (spans.length === 0) {
                out.push({ type: 'text', content: cell });
                return out;
            }
            let last = 0;
            for (const span of spans) {
                if (span.start > last) {
                    out.push({ type: 'text', content: cell.slice(last, span.start) });
                }

                const innerStart = span.start + span.delimLen;
                const innerEnd = span.end - span.delimLen;
                out.push({ type: 'code', content: cell.slice(innerStart, innerEnd) });
                last = span.end;
            }
            if (last < cell.getSize()) {
                out.push({ type: 'text', content: cell.slice(last) });
            }
            return out;
        }

        let last = 0;
        for (const block of blocks) {
            if (block.start > last) {
                out.push({ type: 'text', content: cell.slice(last, block.start) });
            }

            const seg: { type: 'code'; content: ReadableContent; lang?: ReadableContent } = { type: 'code', content: cell.slice(block.innerStart, block.innerEnd) };
            if (block.lang) {
                seg.lang = block.lang;
            }
            out.push(seg);
            last = block.end;
        }

        if (last < cell.getSize()) {
            out.push({ type: 'text', content: cell.slice(last) });
        }
        return out;
    }
}

