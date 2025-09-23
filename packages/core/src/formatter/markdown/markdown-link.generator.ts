import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/reader.adapter.js';

@injectable()
export class MarkdownLinkGenerator {
    /**
     * Transform URLs in text to markdown links.
     * By default creates autolinks (<url>), or full links if fullLinkFormat is true.
     */
    private readonly urlRegex = /(?<!<)https?:\/\/[^\s)\]>]{1,500}(?!>)/g;
    private readonly linkRegex = /\[([^\]]{0,200})\]\(([^)]{0,500})\)/g;

    public transformUrls(content: ReadableContent, fullLinkFormat = false): ReadableContent {
        if (!content || content.length === 0) return content;

        const segments = this.splitIntoCodeAndTextSegments(content);

        const processed = segments
            .map((s) => (s.code ? s.content : this.processFragment(s.content, fullLinkFormat)))
            .join('');

        return Buffer.from(processed);
    }

    private processFragment(content: ReadableContent, fullLinkFormat: boolean): string {
        if (!content) return content;


        const contentString = content.toString();

        // quick check for markdown links; reset stateful lastIndex before using test/exec
        this.linkRegex.lastIndex = 0;
        const containsMarkdownLinks = this.linkRegex.test(contentString);

        if (!containsMarkdownLinks) {
            return contentString.replace(this.urlRegex, (url: string, offset: number) => this.replaceUrl(url, offset, content, fullLinkFormat));
        }

        // There are markdown links: replace URLs only outside link destinations
        this.linkRegex.lastIndex = 0;
        const links: Array<{ start: number; end: number; fullMatch: string }> = [];
        let match: RegExpExecArray | null;
        let loopCount = 0;
        const maxLoops = 1000;
        while ((match = this.linkRegex.exec(contentString)) !== null && loopCount < maxLoops) {
            links.push({ start: match.index, end: match.index + match[0].length, fullMatch: match[0] });
            loopCount++;
        }

        let output = '';
        let lastIndex = 0;

        for (const linkInfo of links) {
            const beforeLink = contentString.substring(lastIndex, linkInfo.start);
            output += beforeLink.replace(this.urlRegex, (url: string, offsetInBefore: number) => this.replaceUrl(url, lastIndex + (offsetInBefore || 0), content, fullLinkFormat));
            output += linkInfo.fullMatch;
            lastIndex = linkInfo.end;
        }

        const afterLast = contentString.substring(lastIndex);
        output += afterLast.replace(this.urlRegex, (url: string, offsetInAfter: number) => this.replaceUrl(url, lastIndex + (offsetInAfter || 0), content, fullLinkFormat));

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
        const n = content.length;

        const contentString = content.toString();

        while (idx < n) {
            // fenced code block: starts with ```
            if (contentString.startsWith('```', idx)) {
                const endFence = contentString.indexOf('```', idx + 3);
                if (endFence === -1) {
                    segments.push({ code: true, content: Buffer.from(contentString.substring(idx)) });
                    break;
                }
                segments.push({ code: true, content: Buffer.from(contentString.substring(idx, endFence + 3)) });
                idx = endFence + 3;
                continue;
            }

            // inline code span: one or more backticks. Support matching number of backticks.
            if (contentString[idx] === '`') {
                let tickCount = 1;
                while (idx + tickCount < n && contentString[idx + tickCount] === '`') tickCount++;
                const ticks = '`'.repeat(tickCount);
                const end = contentString.indexOf(ticks, idx + tickCount);
                if (end === -1) {
                    segments.push({ code: true, content: Buffer.from(contentString.substring(idx)) });
                    break;
                }
                segments.push({ code: true, content: Buffer.from(contentString.substring(idx, end + tickCount)) });
                idx = end + tickCount;
                continue;
            }

            // normal text until next fence or backtick
            const nextBacktick = contentString.indexOf('`', idx);
            const nextFence = contentString.indexOf('```', idx);
            let next = -1;
            if (nextBacktick === -1 && nextFence === -1) next = n;
            else if (nextBacktick === -1) next = nextFence;
            else if (nextFence === -1) next = nextBacktick;
            else next = Math.min(nextBacktick, nextFence);

            segments.push({ code: false, content: Buffer.from(contentString.substring(idx, next)) });
            idx = next;
        }

        return segments;
    }

}
