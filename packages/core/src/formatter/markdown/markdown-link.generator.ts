import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';

@injectable()
export class MarkdownLinkGenerator {
    private static readonly URL_REGEX = /(?<!<)https?:\/\/[^\s)\]>]{1,500}(?!>)/g;
    private static readonly LINK_REGEX = /\[([^\]]{0,200})\]\(([^)]{0,500})\)/g;

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
        MarkdownLinkGenerator.LINK_REGEX.lastIndex = 0;
        const containsMarkdownLinks = content.test(MarkdownLinkGenerator.LINK_REGEX);

        if (!containsMarkdownLinks) {
            return content.replace(
                MarkdownLinkGenerator.URL_REGEX,
                (url: string, offset: number) => this.replaceUrl(url, offset, content, fullLinkFormat)
            );
        }

        // There are markdown links: replace URLs only outside link destinations
        MarkdownLinkGenerator.LINK_REGEX.lastIndex = 0;
        const links: Array<{ start: number; end: number; fullMatch: string }> = [];
        let match: RegExpExecArray | null;
        while ((match = content.execRegExp(MarkdownLinkGenerator.LINK_REGEX)) !== null) {
            links.push({ start: match.index, end: (match.index) + match[0].length, fullMatch: match[0] });
        }

        let output = ReadableContent.empty();
        let lastIndex = 0;

        for (const linkInfo of links) {
            const beforeLink = content.slice(lastIndex, linkInfo.start);
            output = output.append(
                beforeLink.replace(
                    MarkdownLinkGenerator.URL_REGEX,
                    (url: string, offsetInBefore: number) => this.replaceUrl(url, lastIndex + (offsetInBefore || 0), content, fullLinkFormat)
                ),
                linkInfo.fullMatch
            );
            lastIndex = linkInfo.end;
        }

        const afterLast = content.slice(lastIndex);
        output = output.append(
            afterLast.replace(
                MarkdownLinkGenerator.URL_REGEX,
                (url: string, offsetInAfter: number) => this.replaceUrl(url, lastIndex + (offsetInAfter || 0), content, fullLinkFormat)
            )
        );

        return output;
    }

    private replaceUrl(url: string, absoluteOffset: number, baseContent: ReadableContent, fullLinkFormat: boolean): string {
        const baseContentString = baseContent.toString();

        const beforeChar = absoluteOffset > 0 ? baseContentString[absoluteOffset - 1] : undefined;
        const afterChar = baseContentString[absoluteOffset + url.length];
        if (beforeChar === '<' && afterChar === '>') return url;

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
