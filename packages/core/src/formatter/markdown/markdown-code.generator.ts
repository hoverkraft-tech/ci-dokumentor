import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';
import { MarkdownFormatterAdapter } from './markdown-formatter.adapter.js';

@injectable()
export class MarkdownCodeGenerator {

    private static readonly TICK = '`';
    private static readonly TICK_CHAR_CODE = 0x60;
    private static readonly TILDE_CHAR_CODE = 0x7E;
    private static readonly MIN_FENCE_LEN = 3;
    private static readonly HTML_NEWLINE_ENTITY = '&#13;';
    private static readonly DEFAULT_LANGUAGE = new ReadableContent('text');

    /**
     * Heuristic to check whether a single line starts a fenced code block.
     * Accepts any run of 3 or more backticks at the start of the (trimmed) line.
     */
    isFenceLine(line: ReadableContent): boolean {
        if (line.isEmpty()) return false;
        return line.test(new RegExp(`^${MarkdownCodeGenerator.TICK}{${MarkdownCodeGenerator.MIN_FENCE_LEN},}`));
    }

    /**
     * Compute a backtick fence buffer that is longer than any run of backticks inside the content.
     * Minimum fence length is 3 (```).
     */
    backtickFenceFor(content: ReadableContent): ReadableContent {
        if (content.isEmpty()) {
            return ReadableContent.empty().padEnd(MarkdownCodeGenerator.MIN_FENCE_LEN, MarkdownCodeGenerator.TICK);
        }

        let maxRun = 0;
        let current = 0;
        for (let i = 0; i < content.getSize(); i++) {
            if (content.includesAt(MarkdownCodeGenerator.TICK, i)) {
                current++;
                if (current > maxRun) {
                    maxRun = current;
                }
            } else {
                current = 0;
            }
        }

        const fenceLen = Math.max(MarkdownCodeGenerator.MIN_FENCE_LEN, maxRun + 1);
        return ReadableContent.empty().padEnd(fenceLen, MarkdownCodeGenerator.TICK);
    }

    codeBlock(content: ReadableContent, language?: ReadableContent, toHTML = false): ReadableContent {
        const resolvedLanguage = language && !language.isEmpty()
            ? language
            : MarkdownCodeGenerator.DEFAULT_LANGUAGE;

        if (toHTML) {
            return this.htmlCodeBlock(content, resolvedLanguage);
        }
        const fence = this.backtickFenceFor(content);
        return fence.append(
            resolvedLanguage,
            String.fromCharCode(ReadableContent.NEW_LINE_CHAR_CODE),
            content.trim(),
            String.fromCharCode(ReadableContent.NEW_LINE_CHAR_CODE),
            fence,
            String.fromCharCode(ReadableContent.NEW_LINE_CHAR_CODE),
        );
    }

    inlineCode(content: ReadableContent): ReadableContent {
        return ReadableContent.empty().append(
            MarkdownCodeGenerator.TICK,
            content.escape([MarkdownCodeGenerator.TICK, MarkdownFormatterAdapter.ITALIC_DELIMITER]).htmlEscape(),
            MarkdownCodeGenerator.TICK
        );
    }

    private htmlCodeBlock(content: ReadableContent, language: ReadableContent): ReadableContent {
        const inner = content || ReadableContent.empty();
        const innerParts: ReadableContent[] = [];
        let last = 0;
        for (let i = 0; i < inner.getSize(); i++) {
            if (inner.includesAt(ReadableContent.NEW_LINE_CHAR_CODE, i)) {
                if (i > last) {
                    innerParts.push(inner.slice(last, i));
                }
                innerParts.push(new ReadableContent(MarkdownCodeGenerator.HTML_NEWLINE_ENTITY));
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
            while (
                start < seg2.getSize()
                && (
                    seg2.includesAt(ReadableContent.SPACE_CHAR_CODE, start)
                    || seg2.includesAt(ReadableContent.TAB_CHAR_CODE, start)
                    || seg2.includesAt(ReadableContent.CARRIAGE_RETURN_CHAR_CODE, start)
                )
            ) {
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
        // regular Markdown text.
        let result = ReadableContent.empty()
            .append('<!-- textlint-disable -->')
            .append(`<pre lang="`, language.htmlEscape(), `">`);

        for (const part of innerParts) {
            if (part.isEmpty()) {
                continue;
            }
            if (part.equals(MarkdownCodeGenerator.HTML_NEWLINE_ENTITY)) {
                result = result.append(MarkdownCodeGenerator.HTML_NEWLINE_ENTITY);
            } else {
                result = result.append(part.escape([MarkdownCodeGenerator.TICK, '*']).htmlEscape());
            }
        }
        result = result
            .append(`</pre>`)
            .append('<!-- textlint-enable -->');

        return result;
    }

    /**
     * Find inline backtick spans (e.g. `code` or ``code``). Returns ranges with
     * delimiter length. This is a safe linear scan and avoids expensive regexes.
     * existingBlocks is an optional list of ranges to ignore (e.g. fenced blocks).
     */
    public findInlineCode(content: ReadableContent, existingBlocks: Array<{ start: number; end: number }>): Array<{ start: number; end: number; delimLen: number }> {
        const result: Array<{ start: number; end: number; delimLen: number }> = [];

        if (content.isEmpty()) {
            return result;
        }

        const contentSize = content.getSize();
        let pos = 0;

        while (pos < contentSize) {
            const idx = content.search(MarkdownCodeGenerator.TICK, pos);
            if (idx === -1) {
                break;
            }

            if (existingBlocks.some((b) => idx >= b.start && idx < b.end)) {
                pos = idx + 1;
                continue;
            }

            let k = idx;
            while (k < contentSize && content.includesAt(MarkdownCodeGenerator.TICK, k)) {
                k++;
            }

            const delimLen = k - idx;
            let searchPos = k;
            let found = -1;
            while (searchPos < contentSize) {
                const next = content.search(MarkdownCodeGenerator.TICK, searchPos);
                if (next === -1) {
                    break;
                }

                if (existingBlocks.some((b) => next >= b.start && next < b.end)) {
                    searchPos = next + 1;
                    continue;
                }

                let kk = next;
                while (kk < contentSize && content.includesAt(MarkdownCodeGenerator.TICK, kk)) {
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

    public findCodeBlocks(content: ReadableContent): Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: ReadableContent }> {
        const res: Array<{ start: number; end: number; innerStart: number; innerEnd: number; lang?: ReadableContent }> = [];

        if (content.isEmpty()) {
            return res;
        }

        const contentSize = content.getSize();
        let pos = 0;
        while (pos < contentSize) {
            const backtickIdx = content.search(MarkdownCodeGenerator.TICK_CHAR_CODE, pos);
            const tildeIdx = content.search(MarkdownCodeGenerator.TILDE_CHAR_CODE, pos);
            let idx = -1;
            let marker = 0;
            if (backtickIdx === -1 && tildeIdx === -1) {
                break;
            }
            else if (backtickIdx === -1) {
                idx = tildeIdx; marker = MarkdownCodeGenerator.TILDE_CHAR_CODE;
            }
            else if (tildeIdx === -1) {
                idx = backtickIdx; marker = MarkdownCodeGenerator.TICK_CHAR_CODE;
            }
            else if (backtickIdx < tildeIdx) {
                idx = backtickIdx; marker = MarkdownCodeGenerator.TICK_CHAR_CODE;
            }
            else {
                idx = tildeIdx; marker = MarkdownCodeGenerator.TILDE_CHAR_CODE;
            }

            if (idx === -1) {
                break;
            }
            if (idx !== 0 && !content.includesAt(ReadableContent.NEW_LINE_CHAR_CODE, idx - 1)) {
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

            const infoLineEnd = content.search(ReadableContent.NEW_LINE_CHAR_CODE, k);
            if (infoLineEnd === -1) {
                break;
            }

            const innerStart = infoLineEnd + 1;
            let lang: ReadableContent | undefined = undefined;
            if (infoLineEnd > k) {
                let ls = k;
                let le = infoLineEnd - 1;
                while (ls <= le && content.includesAt(ReadableContent.SPACE_CHAR_CODE, ls)) {
                    ls++;
                }
                while (le >= ls && (content.includesAt(ReadableContent.SPACE_CHAR_CODE, le) || content.includesAt(ReadableContent.CARRIAGE_RETURN_CHAR_CODE, le))) {
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
                if (next !== 0 && !content.includesAt(ReadableContent.NEW_LINE_CHAR_CODE, next - 1)) {
                    searchPos = next + 1;
                    continue;
                }

                let kk = next;
                while (kk < contentSize && content.includesAt(marker, kk)) {
                    kk++;
                }

                const closeLen = kk - next;
                if (closeLen >= fenceLen) {
                    const lineEnd = content.search(ReadableContent.NEW_LINE_CHAR_CODE, kk);
                    const endPos = (lineEnd === -1) ? kk : (lineEnd + 1);
                    found = next;
                    const innerEnd = next - 1 >= 0 && content.includesAt(ReadableContent.NEW_LINE_CHAR_CODE, next - 1) ? next - 1 : next;
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
