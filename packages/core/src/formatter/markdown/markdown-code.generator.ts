import { injectable } from 'inversify';
import { ReadableContent } from '../../reader/readable-content.js';

@injectable()
export class MarkdownCodeGenerator {

    /**
     * Heuristic to check whether a single line starts a fenced code block.
     * Accepts any run of 3 or more backticks at the start of the (trimmed) line.
     */
    isFenceLine(line: ReadableContent): boolean {
        if (line.isEmpty()) return false;
        return line.test(/^`{3,}/);
    }

    /**
     * Compute a backtick fence buffer that is longer than any run of backticks inside the content.
     * Minimum fence length is 3 (```).
     */
    backtickFenceFor(content: ReadableContent): ReadableContent {
        if (content.isEmpty()) {
            return new ReadableContent('```');
        }

        let maxRun = 0;
        let current = 0;
        const tick = '`';
        for (let i = 0; i < content.getSize(); i++) {
            if (content.includesAt(tick, i)) {
                current++;
                if (current > maxRun) {
                    maxRun = current;
                }
            } else {
                current = 0;
            }
        }

        const fenceLen = Math.max(3, maxRun + 1);
        return ReadableContent.empty().padEnd(fenceLen, tick);
    }
}
