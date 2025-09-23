import { ReadableContent } from '../../reader/reader.adapter.js';

/**
 * Class responsible for generating markdown tables from headers and rows.
 * Self-contained: implements the small set of helpers needed to render tables.
 */
export class MarkdownTableGenerator {
    table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent {
        const isEmptyTable = (!headers || headers.length === 0) && (!rows || rows.length === 0);
        if (isEmptyTable) return Buffer.alloc(0);

        const headerLines = headers.map((h) => this.splitMultilineCell(h));
        const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));

        const colWidths = this.computeColWidths(headers, rows, headerLines);
        return this.renderTable(headers, rows, headerLines, colWidths, maxHeaderLines);
    }

    /**
     * Normalize a cell for measurement and output escaping pipe characters.
     */
    private normalizeCell(cell: ReadableContent): ReadableContent {
        return this.escape(this.trimContent(cell), '|');
    }

    private computeColWidths(
        headers: ReadableContent[],
        rows: ReadableContent[][],
        headerLines: ReadableContent[][]
    ): number[] {
        const numCols = headers.length;
        const colWidths: number[] = Array.from({ length: numCols }, () => 0);
        for (let c = 0; c < numCols; c++) {
            const hLines = headerLines[c] || [Buffer.alloc(0)];
            for (const hl of hLines) {
                const line = hl || Buffer.alloc(0);
                const tb = this.containsFence(line) ? this.transformLineForFence(line) : line;
                const norm = this.normalizeCell(tb || Buffer.alloc(0));
                colWidths[c] = Math.max(colWidths[c], norm.length);
            }
        }

        for (const row of rows) {
            for (let c = 0; c < numCols; c++) {
                const clines = this.splitMultilineCell(row[c] || Buffer.alloc(0));
                for (const ln of clines) {
                    const line = ln || Buffer.alloc(0);
                    const tb = this.containsFence(line) ? this.transformLineForFence(line) : line;
                    const norm = this.normalizeCell(tb || Buffer.alloc(0));
                    colWidths[c] = Math.max(colWidths[c], norm.length);
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
        const parts: ReadableContent[] = [];

        // main header (first header line)
        const mainHeaderCells: string[] = [];
        for (let c = 0; c < numCols; c++) {
            const first = (headerLines[c] && headerLines[c][0]) || Buffer.alloc(0);
            const tb = this.containsFence(first) ? this.transformLineForFence(first) : first;
            mainHeaderCells.push(this.padCell(tb, colWidths[c]));
        }
        parts.push(Buffer.from(`| ${mainHeaderCells.join(' | ')} |`));
        parts.push(this.lineBreak());

        parts.push(Buffer.from(`| ${colWidths.map((w) => '-'.repeat(Math.max(3, w))).join(' | ')} |`));
        parts.push(this.lineBreak());

        // additional header lines
        for (let lineIndex = 1; lineIndex < maxHeaderLines; lineIndex++) {
            const lineCells: string[] = [];
            for (let c = 0; c < numCols; c++) {
                const hl = (headerLines[c] && headerLines[c][lineIndex]) || Buffer.alloc(0);
                const tb = this.containsFence(hl) ? this.transformLineForFence(hl) : hl;
                lineCells.push(this.padCell(tb, colWidths[c]));
            }
            parts.push(Buffer.from(`| ${lineCells.join(' | ')} |`));
            parts.push(this.lineBreak());
        }

        // rows
        for (const row of rows) {
            this.renderRow(numCols, row, colWidths, parts);
        }

        return this.appendContent(...parts);
    }

    private renderRow(
        numCols: number,
        row: ReadableContent[],
        colWidths: number[],
        parts: ReadableContent[]
    ) {
        const cellLines = [] as ReadableContent[][];
        for (let c = 0; c < numCols; c++) {
            const lines = this.splitMultilineCell(row[c] || Buffer.alloc(0));
            const tlines = lines.map((l) => (this.containsFence(l || Buffer.alloc(0)) ? this.transformLineForFence(l || Buffer.alloc(0)) : (l || Buffer.alloc(0))));
            cellLines.push(tlines as ReadableContent[]);
        }
        const maxLines = Math.max(...cellLines.map((l) => l.length));
        for (let li = 0; li < maxLines; li++) {
            const outCells: string[] = [];
            for (let c = 0; c < numCols; c++) {
                const lines = cellLines[c];
                const tb = (lines && lines[li]) || Buffer.alloc(0);
                outCells.push(this.padCell(tb, colWidths[c]));
            }
            parts.push(Buffer.from(`| ${outCells.join(' | ')} |`));
            parts.push(this.lineBreak());
        }
    }

    private padCell(content: ReadableContent, width: number) {
        return this.bufferToPaddedString(this.normalizeCell(content || Buffer.alloc(0)), width);
    }

    private transformLineForFence(lineBuf: ReadableContent): ReadableContent {
        const segments = this.splitCellIntoSegments(lineBuf);
        if (segments.length === 0) return Buffer.alloc(0);
        const parts: ReadableContent[] = [];
        for (const seg of segments) {
            if (seg.type === 'text') {
                const t = this.trimContent(seg.content);
                if (t.length > 0) parts.push(this.htmlEscapeContent(t));
            } else {
                const langAttr = seg.lang ? ` lang="${seg.lang}"` : '';
                const inner = seg.content || Buffer.alloc(0);
                const innerParts: ReadableContent[] = [];
                let last = 0;
                for (let i = 0; i < inner.length; i++) {
                    if (inner[i] === 0x0A /* LF */) {
                        if (i > last) innerParts.push(inner.subarray(last, i));
                        innerParts.push(Buffer.from('&#13;'));
                        last = i + 1;
                    }
                }
                if (last < inner.length) innerParts.push(inner.subarray(last));
                for (let pi = 0; pi < innerParts.length; pi += 2) {
                    const seg2 = innerParts[pi] as ReadableContent;
                    if (!seg2 || seg2.length === 0) continue;
                    let sStart = 0;
                    while (sStart < seg2.length && (seg2[sStart] === 0x20 || seg2[sStart] === 0x09 || seg2[sStart] === 0x0D)) sStart++;
                    if (sStart === 0) continue;
                    if (sStart >= seg2.length) innerParts[pi] = Buffer.alloc(0);
                    else innerParts[pi] = this.appendContent(Buffer.from(' '), seg2.subarray(sStart));
                }
                const innerBuf = innerParts.length === 0 ? Buffer.alloc(0) : (innerParts.length === 1 ? innerParts[0] : this.appendContent(...innerParts));
                parts.push(Buffer.from(`<pre${langAttr}>`));
                parts.push(this.htmlEscapePreserveEntities(innerBuf));
                parts.push(Buffer.from(`</pre>`));
            }
        }
        return parts.length === 0 ? Buffer.alloc(0) : (parts.length === 1 ? parts[0] : this.appendContent(...parts));
    }

    // The methods below are extracted and simplified copies from the adapter to keep
    // the generator self-contained. They intentionally operate on ReadableContent.

    private appendContent(...parts: ReadableContent[]): ReadableContent {
        if (!parts || parts.length === 0) return Buffer.alloc(0);
        const contentParts: ReadableContent[] = new Array(parts.length);
        let total = 0;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            contentParts[i] = part as ReadableContent;
            total += contentParts[i].length;
        }
        if (contentParts.length === 1) return contentParts[0];
        const out = Buffer.allocUnsafe(total);
        let offset = 0;
        for (let i = 0; i < contentParts.length; i++) {
            const b = contentParts[i];
            if (b.length === 0) continue;
            b.copy(out, offset);
            offset += b.length;
        }
        return out;
    }

    private lineBreak(): ReadableContent {
        return Buffer.from('\n');
    }

    private escape(input: ReadableContent, search: string): ReadableContent {
        if (!input || input.length === 0) return Buffer.alloc(0);
        if (!search || search.length === 0) return input;
        const searchBuf = Buffer.from(search);
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
        if (parts.length === 0) return Buffer.alloc(0);
        if (parts.length === 1) return parts[0];
        return this.appendContent(...parts);
    }



    private trimContent(input: ReadableContent): ReadableContent {
        if (!input || input.length === 0) return Buffer.alloc(0);
        let start = 0;
        let end = input.length - 1;
        const isWhitespace = (b: number) => b === 0x20 || b === 0x09 || b === 0x0A || b === 0x0D;
        while (start <= end && isWhitespace(input[start])) start++;
        while (end >= start && isWhitespace(input[end])) end--;
        if (end < start) return Buffer.alloc(0);
        return input.subarray(start, end + 1);
    }

    private splitLines(input: ReadableContent): ReadableContent[] {
        if (!input || input.length === 0) return [Buffer.alloc(0)];
        const lines: ReadableContent[] = [];
        let lineStart = 0;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === 0x0A) {
                let line = input.subarray(lineStart, i);
                if (line.length > 0 && line[line.length - 1] === 0x0D) line = line.subarray(0, line.length - 1);
                lines.push(line);
                lineStart = i + 1;
            }
        }
        if (lineStart <= input.length - 1) {
            let line = input.subarray(lineStart, input.length);
            if (line.length > 0 && line[line.length - 1] === 0x0D) line = line.subarray(0, line.length - 1);
            lines.push(line);
        } else if (lineStart === input.length) {
            lines.push(Buffer.alloc(0));
        }
        return lines;
    }

    private splitMultilineCell(input: ReadableContent): ReadableContent[] {
        input = this.trimContent(input);
        if (!input || input.length === 0) return [Buffer.alloc(0)];
        const str = input.toString();
        // Find fenced code blocks (``` or ~~~) and inline code spans (one or more backticks
        // used as delimiters). We replace them with placeholders before splitting into
        // lines so their internal newlines won't cause the cell to be split across rows.
        const backtickFenceRegex = /```[\s\S]*?```/g;
        const tildeFenceRegex = /~~~[\s\S]*?~~~/g;
        // Inline code spans use a sequence of one or more backticks as delimiter and must
        // be closed by the same number of backticks. Use a backreference to match closing
        // delimiter: (`+)[\s\S]*?\1
        const inlineBacktickRegex = /(`+)[\s\S]*?\1/g;

        const codeBlocks: { start: number; end: number; replacement: string }[] = [];
        const collectMatches = (regex: RegExp) => {
            let m;
            while ((m = regex.exec(str)) !== null) {
                const matchStart = m.index;
                const matchEnd = m.index + m[0].length;
                // skip matches that are inside an already collected block
                if (codeBlocks.some((b) => matchStart >= b.start && matchStart < b.end)) continue;
                const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
                codeBlocks.push({ start: matchStart, end: matchEnd, replacement: placeholder });
            }
        };

        // collect fenced blocks first so inline spans inside fences are ignored
        collectMatches(backtickFenceRegex);
        collectMatches(tildeFenceRegex);
        // then collect inline backtick spans (may contain newlines in non-standard inputs)
        collectMatches(inlineBacktickRegex);

        if (codeBlocks.length === 0) {
            return this.splitLines(input);
        }

        let modifiedStr = str;
        const order = codeBlocks.map((_, idx) => idx).sort((a, b) => codeBlocks[a].start - codeBlocks[b].start);
        for (let k = order.length - 1; k >= 0; k--) {
            const i = order[k];
            const block = codeBlocks[i];
            modifiedStr = modifiedStr.substring(0, block.start) + block.replacement + modifiedStr.substring(block.end);
        }

        const lines = this.splitLines(Buffer.from(modifiedStr));
        const restoredLines: ReadableContent[] = [];
        for (const line of lines) {
            let lineStr = line.toString();
            for (let i = 0; i < codeBlocks.length; i++) {
                const placeholder = codeBlocks[i].replacement;
                if (lineStr.includes(placeholder)) {
                    const originalCodeBlock = str.substring(codeBlocks[i].start, codeBlocks[i].end);
                    lineStr = lineStr.replace(placeholder, originalCodeBlock);
                }
            }
            restoredLines.push(Buffer.from(lineStr));
        }
        return restoredLines;
    }

    private splitCellIntoSegments(cell: ReadableContent): Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: string }> {
        const out: Array<{ type: 'text' | 'code'; content: ReadableContent; lang?: string }> = [];
        if (!cell || cell.length === 0) return out;
        const blocks = this.findFencedBlocks(cell);
        // If no fenced blocks found, also try to detect inline backtick spans and
        // treat them as code segments. This mirrors fenced block handling so that
        // inline code spans with newlines are rendered as <pre> in tables.
        if (blocks.length === 0) {
            const str = cell.toString();
            const inlineRegex = /(`+)[\s\S]*?\1/g;
            let m: RegExpExecArray | null;
            let last = 0;
            let foundAny = false;
            while ((m = inlineRegex.exec(str)) !== null) {
                foundAny = true;
                const start = m.index;
                const end = m.index + m[0].length;
                if (start > last) out.push({ type: 'text', content: cell.subarray(last, start) });
                // inner content excluding delimiters
                const delimLen = m[1].length;
                const innerStart = start + delimLen;
                const innerEnd = end - delimLen;
                out.push({ type: 'code', content: cell.subarray(innerStart, innerEnd) });
                last = end;
            }
            if (foundAny) {
                if (last < cell.length) out.push({ type: 'text', content: cell.subarray(last) });
                return out;
            }
            out.push({ type: 'text', content: cell });
            return out;
        }
        let last = 0;
        for (const b of blocks) {
            if (b.start > last) out.push({ type: 'text', content: cell.subarray(last, b.start) });
            const seg: { type: 'code'; content: ReadableContent; lang?: string } = { type: 'code', content: cell.subarray(b.innerStart, b.innerEnd) };
            if (b.lang) seg.lang = b.lang;
            out.push(seg);
            last = b.end;
        }
        if (last < cell.length) out.push({ type: 'text', content: cell.subarray(last) });
        return out;
    }

    private containsFence(input: ReadableContent): boolean {
        if (!input || input.length === 0) return false;
        const blocks = this.findFencedBlocks(input);
        if (blocks.length > 0) return true;
        // also detect inline backtick spans (e.g. `code` or ``code``) but only
        // treat them as fences if they contain an inner newline. That avoids
        // switching the whole table rendering to fenced mode for simple inline
        // code spans that are single-line.
        const s = input.toString();
        const inlineRegexGlobal = /(`+)[\s\S]*?\1/g;
        let m: RegExpExecArray | null;
        while ((m = inlineRegexGlobal.exec(s)) !== null) {
            // m[0] is the whole match including delimiters
            const inner = m[0].slice(m[1].length, m[0].length - m[1].length);
            if (inner.includes('\n') || inner.includes('\r')) return true;
        }
        return false;
    }

    private findFencedBlocks(buf: ReadableContent): Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: string }> {
        const res: Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: string }> = [];
        if (!buf || buf.length === 0) return res;
        const len = buf.length;
        let pos = 0;
        while (pos < len) {
            const backtickIdx = buf.indexOf(0x60 /* ` */, pos);
            const tildeIdx = buf.indexOf(0x7E /* ~ */, pos);
            let idx = -1;
            let marker = 0;
            if (backtickIdx === -1 && tildeIdx === -1) break;
            else if (backtickIdx === -1) { idx = tildeIdx; marker = 0x7E; }
            else if (tildeIdx === -1) { idx = backtickIdx; marker = 0x60; }
            else if (backtickIdx < tildeIdx) { idx = backtickIdx; marker = 0x60; }
            else { idx = tildeIdx; marker = 0x7E; }
            if (idx === -1) break;
            if (idx !== 0 && buf[idx - 1] !== 0x0A) { pos = idx + 1; continue; }
            let k = idx;
            while (k < len && buf[k] === marker) k++;
            const fenceLen = k - idx;
            if (fenceLen < 3) { pos = idx + 1; continue; }
            const infoLineEnd = buf.indexOf(0x0A, k);
            if (infoLineEnd === -1) break;
            const innerStart = infoLineEnd + 1;
            let lang: string | undefined = undefined;
            if (infoLineEnd > k) {
                let ls = k;
                let le = infoLineEnd - 1;
                while (ls <= le && buf[ls] === 0x20) ls++;
                while (le >= ls && (buf[le] === 0x20 || buf[le] === 0x0D)) le--;
                if (le >= ls) lang = buf.subarray(ls, le + 1).toString();
            }
            let searchPos = innerStart;
            let found = -1;
            while (searchPos < len) {
                const next = buf.indexOf(marker, searchPos);
                if (next === -1) break;
                if (next !== 0 && buf[next - 1] !== 0x0A) { searchPos = next + 1; continue; }
                let kk = next;
                while (kk < len && buf[kk] === marker) kk++;
                const closeLen = kk - next;
                if (closeLen >= fenceLen) {
                    const lineEnd = buf.indexOf(0x0A, kk);
                    const endPos = (lineEnd === -1) ? kk : (lineEnd + 1);
                    found = next;
                    const innerEnd = next - 1 >= 0 && buf[next - 1] === 0x0A ? next - 1 : next;
                    res.push({ start: idx, end: endPos, innerStart, innerEnd, lang });
                    pos = endPos;
                    break;
                }
                searchPos = kk + 1;
            }
            if (found === -1) break;
        }
        return res;
    }

    private bufferToPaddedString(content: ReadableContent, width: number): string {
        const t = this.trimContent(content);
        const len = t.length;
        const s = t.toString();
        const pad = Math.max(0, width - len);
        return s + ' '.repeat(pad);
    }

    private htmlEscapeContent(content: ReadableContent): ReadableContent {
        if (!content || content.length === 0) return Buffer.alloc(0);
        const parts: ReadableContent[] = [];
        let last = 0;
        for (let i = 0; i < content.length; i++) {
            const b = content[i];
            if (b === 0x26 || b === 0x3C || b === 0x3E) {
                if (i > last) parts.push(content.subarray(last, i));
                if (b === 0x26) parts.push(Buffer.from('&amp;'));
                else if (b === 0x3C) parts.push(Buffer.from('&lt;'));
                else parts.push(Buffer.from('&gt;'));
                last = i + 1;
            }
        }
        if (last < content.length) parts.push(content.subarray(last));
        if (parts.length === 0) return Buffer.alloc(0);
        if (parts.length === 1) return parts[0];
        return this.appendContent(...parts);
    }

    private htmlEscapePreserveEntities(content: ReadableContent): ReadableContent {
        if (!content || content.length === 0) return Buffer.alloc(0);
        const parts: ReadableContent[] = [];
        let last = 0;
        for (let i = 0; i < content.length; i++) {
            const b = content[i];
            if (b === 0x3C || b === 0x3E) {
                if (i > last) parts.push(content.subarray(last, i));
                if (b === 0x3C) parts.push(Buffer.from('&lt;'));
                else parts.push(Buffer.from('&gt;'));
                last = i + 1;
            }
        }
        if (last < content.length) parts.push(content.subarray(last));
        if (parts.length === 0) return Buffer.alloc(0);
        if (parts.length === 1) return parts[0];
        return this.appendContent(...parts);
    }
}

