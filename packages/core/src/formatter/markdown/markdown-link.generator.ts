import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';

@injectable()
export class MarkdownLinkGenerator {
    private readonly urlRegex = /(?<!<)https?:\/\/[^\s)\]>]{1,500}(?!>)/g;
    private readonly linkRegex = /\[([^\]]{0,200})\]\(([^)]{0,500})\)/g;

    /**
     * Transform URLs in text to markdown links.
     * By default creates autolinks (<url>), or full links if fullLinkFormat is true.
     */
    public transformUrls(content: ReadableContent, fullLinkFormat = false): ReadableContent {
        if (content.isEmpty()) {
            return content;
        }

        const segments = this.splitIntoCodeAndTextSegments(content);

        const processed = segments
            .map((s) => (s.code ? s.content : this.processFragment(s.content, fullLinkFormat)))
            .join('');

        return new ReadableContent(processed);
    }

    private processFragment(content: ReadableContent, fullLinkFormat: boolean): ReadableContent {
        if (content.isEmpty()) {
            return content;
        }

        // Quick check for markdown links; reset stateful lastIndex before using test/exec
        this.linkRegex.lastIndex = 0;
        const containsMarkdownLinks = content.execRegExp(this.linkRegex);
        this.linkRegex.lastIndex = 0;

        if (!containsMarkdownLinks) {
            const replaced = content.replace(
                this.urlRegex,
                (url: string, offset: number) => this.replaceUrl(url, offset, content, fullLinkFormat)
            );

            return new ReadableContent(replaced);
        }

        // There are markdown links: replace URLs only outside link destinations
        const links: Array<{ start: number; end: number; fullMatch: string }> = [];
        let match: RegExpExecArray | null;
        while ((match = content.execRegExp(this.linkRegex)) !== null) {
            links.push({ start: match.index, end: match.index + match[0].length, fullMatch: match[0] });
        }
        this.linkRegex.lastIndex = 0;

        let result = ReadableContent.empty();
        let lastIndex = 0;

        const text = content.toString();
        for (const linkInfo of links) {
            const beforeLink = text.slice(lastIndex, linkInfo.start);
            const processedBefore = beforeLink.replace(
                this.urlRegex,
                (url: string, offsetInBefore: number) => this.replaceUrl(url, lastIndex + (offsetInBefore ?? 0), content, fullLinkFormat)
            );

            result = result.append(processedBefore, linkInfo.fullMatch);
            lastIndex = linkInfo.end;
        }

        const afterLast = content.slice(lastIndex);
        const processedAfter = afterLast.replace(
            this.urlRegex,
            (url: string, offsetInAfter: number) => this.replaceUrl(url, lastIndex + (offsetInAfter ?? 0), content, fullLinkFormat)
        );

        result = result.append(processedAfter);

        return result;
    }

    private replaceUrl(url: string, absoluteOffset: number, baseContent: ReadableContent, fullLinkFormat: boolean): string {
        if (
            absoluteOffset > 0
            && baseContent.includesAt('<', absoluteOffset - 1)
            && baseContent.includesAt('>', absoluteOffset + url.length)
        ) {
            return url;
        }

        const cleanUrl = url.replace(/[.,;!?]{0,5}$/, '');
        const trailingPunct = url.slice(cleanUrl.length);

        return fullLinkFormat ? `[${cleanUrl}](${cleanUrl})${trailingPunct}` : `<${cleanUrl}>${trailingPunct}`;
    }

    private splitIntoCodeAndTextSegments(content: ReadableContent): Array<{ code: boolean; content: ReadableContent }> {
        const segments: Array<{ code: boolean; content: ReadableContent }> = [];
        let idx = 0;

        const contentLength = content.getSize();

        while (idx < contentLength) {
            // Fenced code block: starts with ```
            if (content.startsWith('```', idx)) {
                const endFence = content.search('```', idx + 3);
                if (endFence === -1) {
                    segments.push({ code: true, content: content.slice(idx) });
                    break;
                }
                segments.push({ code: true, content: content.slice(idx, endFence + 3) });
                idx = endFence + 3;
                continue;
            }

            // Inline code span: one or more backticks. Support matching number of backticks.
            if (content.includesAt('`', idx)) {
                let tickCount = 1;
                while (idx + tickCount < contentLength && content.includesAt('`', idx + tickCount)) {
                    tickCount++;
                }

                const ticks = '`'.repeat(tickCount);
                const end = content.search(ticks, idx + tickCount);
                if (end === -1) {
                    segments.push({ code: true, content: new ReadableContent(content.slice(idx)) });
                    break;
                }
                segments.push({ code: true, content: new ReadableContent(content.slice(idx, end + tickCount)) });
                idx = end + tickCount;
                continue;
            }

            // Normal text until next fence or backtick
            const nextBacktick = content.search('`', idx);
            const nextFence = content.search('```', idx);
            let next = -1;
            if (nextBacktick === -1 && nextFence === -1) {
                next = contentLength;
            }
            else if (nextBacktick === -1) {
                next = nextFence;
            }
            else if (nextFence === -1) {
                next = nextBacktick;
            }
            else {
                next = Math.min(nextBacktick, nextFence);
            }

            segments.push({ code: false, content: content.slice(idx, next) });
            idx = next;
        }

        return segments;
    }

}
