import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';

/**
 * Class responsible for generating markdown tables from headers and rows.
 * Self-contained: implements the small set of helpers needed to render tables.
 */
@injectable()
export class MarkdownTableGenerator {
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
                const tb = this.containsFence(line) ? this.transformLineForFence(line) : line;
                const normalizedCell = this.normalizeCell(tb || ReadableContent.empty());
                colWidths[c] = Math.max(colWidths[c], normalizedCell.getSize());
            }
        }

        for (const row of rows) {
            for (let c = 0; c < numCols; c++) {
                const clines = this.splitMultilineCell(row[c] || ReadableContent.empty());
                for (const ln of clines) {
                    const line = ln || ReadableContent.empty();
                    const tb = this.containsFence(line) ? this.transformLineForFence(line) : line;
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
            const tb = this.containsFence(first) ? this.transformLineForFence(first) : first;

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
                const tb = this.containsFence(hl) ? this.transformLineForFence(hl) : hl;

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
                    this.containsFence(line || ReadableContent.empty())
                        ? this.transformLineForFence(line || ReadableContent.empty())
                        : (line || ReadableContent.empty())
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
                const langAttr = seg.lang ? ` lang="${seg.lang}"` : '';
                const inner = seg.content || ReadableContent.empty();
                const innerParts: ReadableContent[] = [];
                let last = 0;
                for (let i = 0; i < inner.getSize(); i++) {
                    if (inner.includesAt(0x0A, i)) {
                        if (i > last) {
                            innerParts.push(inner.slice(last, i));
                        }
                        innerParts.push(new ReadableContent('&#13;'));
                        last = i + 1;
                    }
                }

                if (last < inner.getSize()) {
                    innerParts.push(inner.slice(last));
                }

                for (let pi = 0; pi < innerParts.length; pi += 2) {
                    const seg2 = innerParts[pi];
                    if (seg2.isEmpty()) {
                        continue;
                    }

                    let start = 0;
                    while (start < seg2.getSize() && (seg2.includesAt(0x20, start) || seg2.includesAt(0x09, start) || seg2.includesAt(0x0D, start))) {
                        start++;
                    }

                    if (start === 0) {
                        continue;
                    }

                    if (start >= seg2.getSize()) {
                        innerParts[pi] = ReadableContent.empty();
                    } else {
                        innerParts[pi] = new ReadableContent(' ').append(seg2.slice(start));
                    }
                }

                // Build the <pre> contents carefully: already-formed '&#13;' tokens
                // must be preserved (not escaped). For other parts we apply
                // htmlEscape(). Append parts directly to avoid re-escaping
                // the '&' in '&#13;'.
                // Wrap <pre> fragments with textlint directives so downstream
                // linters like textlint won't parse the preformatted content as
                // regular Markdown text. We include HTML comments which are
                // valid in Markdown and understood by textlint as directives.
                result = result.append('<!-- textlint-disable -->');
                result = result.append(`<pre${langAttr}>`);
                for (const part of innerParts) {
                    if (part.isEmpty()) continue;
                    // preserve exact entity sequences used for inner newlines
                    if (part.equals('&#13;')) {
                        result = result.append('&#13;');
                    } else {
                        result = result.append(part.htmlEscape());
                    }
                }
                result = result.append(`</pre>`);
                result = result.append('<!-- textlint-enable -->');
            }
        }

        return result;
    }

    // The methods below are extracted and simplified copies from the adapter to keep
    // the generator self-contained. They intentionally operate on ReadableContentHandler.

    private lineBreak(): ReadableContent {
        return new ReadableContent('\n');
    }

    private splitMultilineCell(content: ReadableContent): ReadableContent[] {
        content = content.trim();
        if (content.isEmpty()) {
            return [ReadableContent.empty()];
        }
        // Use the buffer-based fenced block finder first (safe, linear scan).
        const fenced = this.findFencedBlocks(content);
        // Find inline backtick spans (one or more backticks) outside fenced blocks.
        const inlineSpans = this.findInlineBacktickSpans(content, fenced);

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

    private splitCellIntoSegments(cell: ReadableContent): Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: ReadableContent }> {
        const out: Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: ReadableContent }> = [];

        if (cell.isEmpty()) {
            return out;
        }

        const blocks = this.findFencedBlocks(cell);
        // If no fenced blocks found, also try to detect inline backtick spans and
        // treat them as code segments. This mirrors fenced block handling so that
        // inline code spans with newlines are rendered as <pre> in tables.
        if (blocks.length === 0) {
            const spans = this.findInlineBacktickSpans(cell, []);
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

    private containsFence(content: ReadableContent): boolean {
        if (content.isEmpty()) {
            return false;
        }

        const blocks = this.findFencedBlocks(content);
        if (blocks.length > 0) {
            return true;
        }

        // also detect inline backtick spans (e.g. `code` or ``code``) but only
        // treat them as fences if they contain an inner newline. That avoids
        // switching the whole table rendering to fenced mode for simple inline
        // code spans that are single-line.
        const spans = this.findInlineBacktickSpans(content, []);
        for (const span of spans) {
            const inner = content.slice(span.start + span.delimLen, span.end - span.delimLen);

            if (inner.includes('\n') || inner.includes('\r')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Find inline backtick spans (e.g. `code` or ``code``). Returns ranges with
     * delimiter length. This is a safe linear scan and avoids expensive regexes.
     * existingBlocks is an optional list of ranges to ignore (e.g. fenced blocks).
     */
    private findInlineBacktickSpans(content: ReadableContent, existingBlocks: Array<{ start: number; end: number }>): Array<{ start: number; end: number; delimLen: number }> {
        const result: Array<{ start: number; end: number; delimLen: number }> = [];

        if (content.isEmpty()) {
            return result;
        }

        const contentSize = content.getSize();
        let pos = 0;

        while (pos < contentSize) {
            const idx = content.search('`', pos);
            if (idx === -1) {
                break;
            }

            // skip if inside existing fenced block
            if (existingBlocks.some((b) => idx >= b.start && idx < b.end)) {
                pos = idx + 1;
                continue;
            }

            let k = idx;
            while (k < contentSize && content.includesAt('`', k)) {
                k++;
            }

            const delimLen = k - idx;
            let searchPos = k;
            let found = -1;
            while (searchPos < contentSize) {
                const next = content.search('`', searchPos);
                if (next === -1) {
                    break;
                }

                if (existingBlocks.some((b) => next >= b.start && next < b.end)) {
                    searchPos = next + 1;
                    continue;
                }
                let kk = next;

                while (kk < contentSize && content.includesAt('`', kk)) {
                    kk++;
                }
                const closeLen = kk - next;
                if (closeLen === delimLen) { found = next; break; }
                searchPos = kk;
            }

            if (found === -1) {
                pos = k;
                continue;
            }

            result.push({ start: idx, end: found + delimLen, delimLen });
            pos = found + delimLen;
        }

        return result;
    }

    private findFencedBlocks(content: ReadableContent): Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: ReadableContent }> {
        const res: Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: ReadableContent }> = [];

        if (content.isEmpty()) {
            return res;
        }

        const contentSize = content.getSize();
        let pos = 0;
        while (pos < contentSize) {
            const backtickIdx = content.search(0x60 /* ` */, pos);
            const tildeIdx = content.search(0x7E /* ~ */, pos);
            let idx = -1;
            let marker = 0;
            if (backtickIdx === -1 && tildeIdx === -1) {
                break;
            }
            else if (backtickIdx === -1) {
                idx = tildeIdx; marker = 0x7E;
            }
            else if (tildeIdx === -1) {
                idx = backtickIdx; marker = 0x60;
            }
            else if (backtickIdx < tildeIdx) {
                idx = backtickIdx; marker = 0x60;
            }
            else {
                idx = tildeIdx; marker = 0x7E;
            }

            if (idx === -1) {
                break;
            }
            if (idx !== 0 && !content.includesAt(0x0A, idx - 1)) {
                pos = idx + 1;
                continue;
            }

            let k = idx;
            while (k < contentSize && content.includesAt(marker, k)) {
                k++;
            }

            const fenceLen = k - idx;
            if (fenceLen < 3) {
                pos = idx + 1;
                continue;
            }

            const infoLineEnd = content.search(0x0A, k);
            if (infoLineEnd === -1) {
                break;
            }

            const innerStart = infoLineEnd + 1;
            let lang: ReadableContent | undefined = undefined;
            if (infoLineEnd > k) {
                let ls = k;
                let le = infoLineEnd - 1;
                while (ls <= le && content.includesAt(0x20, ls)) {
                    ls++;
                }
                while (le >= ls && (content.includesAt(0x20, le) || content.includesAt(0x0D, le))) {
                    le--;
                }
                if (le >= ls) {
                    lang = content.slice(ls, le + 1);
                }
            }
            let searchPos = innerStart;
            let found = -1;
            while (searchPos < contentSize) {
                const next = content.search(marker, searchPos);
                if (next === -1) {
                    break;
                }
                if (next !== 0 && !content.includesAt(0x0A, next - 1)) {
                    searchPos = next + 1;
                    continue;
                }

                let kk = next;
                while (kk < contentSize && content.includesAt(marker, kk)) {
                    kk++;
                }

                const closeLen = kk - next;
                if (closeLen >= fenceLen) {
                    const lineEnd = content.search(0x0A, kk);
                    const endPos = (lineEnd === -1) ? kk : (lineEnd + 1);
                    found = next;
                    const innerEnd = next - 1 >= 0 && content.includesAt(0x0A, next - 1) ? next - 1 : next;
                    res.push({ start: idx, end: endPos, innerStart, innerEnd, lang });
                    pos = endPos;
                    break;
                }
                searchPos = kk + 1;
            }
            if (found === -1) {
                break;
            }
        }
        return res;
    }
}

