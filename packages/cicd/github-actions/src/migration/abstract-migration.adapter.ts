import { injectable, inject } from 'inversify';
import { StringDecoder } from 'string_decoder';
import { MigrationAdapter, SectionIdentifier, FileReaderAdapter } from '@ci-dokumentor/core';
import type { FormatterAdapter, MigrateDocumentationPayload, ReadableContent, ReaderAdapter } from '@ci-dokumentor/core';

/**
 * Abstract base class for migration adapters in the github-actions package.
 */
@injectable()
export abstract class AbstractMigrationAdapter implements MigrationAdapter {
    protected abstract readonly name: string;

    protected abstract readonly sectionMappings: Record<string, SectionIdentifier>;

    protected abstract readonly patterns: {
        startMarkerPattern?: RegExp;
        endMarkerPattern?: RegExp | undefined;
        detectionPattern: RegExp;
    };

    getName(): string {
        return this.name;
    }

    constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) { }

    async supportsDestination(destination: string): Promise<boolean> {
        if (!this.readerAdapter.resourceExists(destination)) {
            return false;
        }

        const content = await this.readerAdapter.readResource(destination);

        // Stream-decode the buffer in chunks to avoid allocating a single
        // large string for very big inputs. We keep a sliding window of
        // recent decoded characters to allow the regex to match across
        // chunk boundaries while still bounding memory usage.
        //
        // Assumption: detectionPattern is reasonably small and will match
        // within the sliding window (default 8KB). If your pattern can
        // span arbitrarily large distances, increase `maxWindow`.
        const decoder = new StringDecoder('utf8');
        const chunkSize = 8 * 1024; // 8KB chunks
        const maxWindow = 8 * 1024; // keep last 8KB of decoded text

        let acc = '';
        for (let offset = 0; offset < content.length; offset += chunkSize) {
            const end = Math.min(offset + chunkSize, content.length);
            const chunk = content.subarray(offset, end);
            acc += decoder.write(chunk);

            if (this.patterns.detectionPattern.test(acc)) {
                return true;
            }

            // keep only the trailing portion necessary for boundary matches
            if (acc.length > maxWindow) {
                acc = acc.slice(-maxWindow);
            }
        }

        // flush any remaining decoded data and one final test
        acc += decoder.end();
        return this.patterns.detectionPattern.test(acc);
    }

    async migrateDocumentation({ rendererAdapter }: MigrateDocumentationPayload): Promise<void> {
        const formatterAdapter = rendererAdapter.getFormatterAdapter();

        let content = await this.readerAdapter.readResource(rendererAdapter.getDestination());

        if (content.length === 0) {
            // No existing content to migrate
            return;
        }

        // Migrate the entire content using the adapter's migrateContent method
        // which can either process markers or wrap sections depending on the adapter
        content = this.migrateContent(content, formatterAdapter);

        // Ensure all supported sections are present
        content = this.addMissingSections(content, formatterAdapter);

        // Merge consecutive sections with same mapping
        content = this.mergeConsecutiveSections(content, formatterAdapter);

        // Replace the entire content through the renderer adapter
        await rendererAdapter.replaceContent(content);
    }

    protected abstract migrateContent(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent;

    /**
     * Generic helper that replaces tool-specific start/end markers inside a
     * content fragment with the standardized ci-dokumentor markers using the
     * configured patterns and section mappings.
     */
    protected processMarkerMappings(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
        // Process the fragment line-by-line to avoid allocating a single large
        // string for the entire fragment. We still perform replacements on each
        // line using the configured start/end patterns, but the scope is the
        // individual line which keeps memory usage bounded.
        const decoder = new StringDecoder('utf8');
        const chunkSize = 8 * 1024;

        const makeNonGlobal = (r?: RegExp) => r ? new RegExp(r.source, r.flags.replace(/g/g, '')) : undefined;
        const startPattern = makeNonGlobal(this.patterns.startMarkerPattern);
        const endPattern = makeNonGlobal(this.patterns.endMarkerPattern);
        const patternsIdentical = startPattern && endPattern && startPattern.source === endPattern.source && startPattern.flags === endPattern.flags;

        let rem = '';
        let offset = 0;
        const parts: ReadableContent[] = [];

        let seenToggle = false; // used when patterns are identical to alternate start/end
        const processLine = (line: string, addNewline: boolean) => {
            let out = line;
            if (patternsIdentical && startPattern) {
                out = out.replace(startPattern, (match: string, sectionName: string) => {
                    const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                    if (!standardSection) {
                        return '';
                    }
                    // Alternate between start and end on successive matches
                    seenToggle = !seenToggle;
                    if (seenToggle) {
                        return formatterAdapter.appendContent(formatterAdapter.sectionStart(standardSection), formatterAdapter.lineBreak()).toString('utf-8');
                    }
                    return formatterAdapter.appendContent(formatterAdapter.lineBreak(), formatterAdapter.sectionEnd(standardSection), formatterAdapter.lineBreak()).toString('utf-8');
                });
            } else {
                // Replace end then start to avoid nested replacement issues when
                // patterns differ.
                if (endPattern) {
                    out = out.replace(endPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return '';
                        }
                        return formatterAdapter.appendContent(formatterAdapter.lineBreak(), formatterAdapter.sectionEnd(standardSection), formatterAdapter.lineBreak()).toString('utf-8');
                    });
                }

                if (startPattern) {
                    out = out.replace(startPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return '';
                        }
                        return formatterAdapter.appendContent(formatterAdapter.sectionStart(standardSection), formatterAdapter.lineBreak()).toString('utf-8');
                    });
                }
            }

            parts.push(Buffer.from(out, 'utf-8'));

            if (addNewline) {
                parts.push(formatterAdapter.lineBreak());
            }
        };

        while (offset < content.length) {
            const end = Math.min(offset + chunkSize, content.length);
            const chunk = content.subarray(offset, end);
            offset = end;
            rem += decoder.write(chunk);

            let idx;
            while ((idx = rem.indexOf(formatterAdapter.lineBreak().toString('utf-8'))) !== -1) {
                const line = rem.slice(0, idx);
                processLine(line, true);
                rem = rem.slice(idx + 1);
            }
        }

        rem += decoder.end();
        if (rem.length) {
            // Last line without a trailing newline
            processLine(rem, false);
        }

        return formatterAdapter.appendContent(...parts);
    }

    protected mapToStandardSection(sectionName: string) {
        const normalizedName = sectionName.toLowerCase().trim();
        return (this.sectionMappings as Record<string, SectionIdentifier>)[normalizedName] || null;
    }

    /**
     * Merge consecutive sections that map to the same target section
     */
    private mergeConsecutiveSections(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
        let result = content.toString('utf-8');

        // Pattern to match section start and end markers
        const sectionPattern = /<!--\s*(\w+):start\s*-->\s*\n([\s\S]*?)<!--\s*\1:end\s*-->/g;

        // Find all sections and group consecutive ones by type
        const sections: Array<{ type: SectionIdentifier, content: string, start: number, end: number }> = [];
        let match;

        while ((match = sectionPattern.exec(result)) !== null) {
            sections.push({
                type: match[1] as SectionIdentifier,
                content: match[2],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Group consecutive sections of the same type
        const mergedSections: Array<{ type: SectionIdentifier, contents: string[], start: number, end: number }> = [];
        let currentGroup: { type: SectionIdentifier, contents: string[], start: number, end: number } | null = null;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            if (currentGroup && currentGroup.type === section.type) {
                // Check if sections are consecutive (only whitespace between them)
                const betweenContent = result.substring(currentGroup.end, section.start).trim();
                if (betweenContent === '') {
                    // Merge this section with the current group
                    currentGroup.contents.push(section.content);
                    currentGroup.end = section.end;
                    continue;
                }
            }

            // Start a new group or finish the current one
            if (currentGroup) {
                mergedSections.push(currentGroup);
            }

            currentGroup = {
                type: section.type,
                contents: [section.content],
                start: section.start,
                end: section.end
            };
        }

        // Don't forget the last group
        if (currentGroup) {
            mergedSections.push(currentGroup);
        }

        // Replace sections from end to start to avoid offset issues
        mergedSections.reverse().forEach(group => {
            if (group.contents.length > 1) {
                // Merge the contents
                const mergedContent = group.contents.join('').replace(/^\s*\n|\n\s*$/g, '').trim();
                const replacement = formatterAdapter.section(
                    group.type,
                    Buffer.from(mergedContent, 'utf-8')
                ).toString('utf-8');

                result = result.substring(0, group.start) + replacement.trim() + result.substring(group.end);
            }
        });

        return Buffer.from(result, 'utf-8');
    }

    /**
     * Add missing supported section markers in the appropriate positions
     */
    private addMissingSections(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {

        const expectedSections: SectionIdentifier[] = Object.values(SectionIdentifier);

        // Determine which sections are already present
        const presentSections = new Set<string>();
        const sectionPattern = /<!--\s*(\w+):start\s*-->/g;
        let match;

        const result = content.toString('utf-8');
        while ((match = sectionPattern.exec(result)) !== null) {
            presentSections.add(match[1]);
        }

        // Build list of missing sections in the canonical order
        const missing = expectedSections.filter(s => !presentSections.has(s));

        if (missing.length === 0) {
            return content;
        }

        // We'll insert missing sections attempting to respect the expected order.
        // Strategy: find the last occurrence in the file of any present section that
        // comes before the missing section in the expected ordering and insert
        // the missing section after it. If no such anchor is found, append at the end.

        // Helper: find insertion index after a given section start/end pair
        const findInsertAfterSection = (contentString: string, sectionName: SectionIdentifier): number => {
            const endMarker = formatterAdapter.sectionEnd(sectionName).toString('utf-8');
            const idx = contentString.lastIndexOf(endMarker);
            if (idx !== -1) {
                return idx + endMarker.length;
            }

            // If there's a start marker but no end (malformed), insert after start
            const startMarker = formatterAdapter.sectionStart(sectionName).toString('utf-8');
            const sidx = result.lastIndexOf(startMarker);
            if (sidx !== -1) {
                return sidx + startMarker.length;
            }

            return -1;
        };

        // Iterate expectedSections order and for each missing section decide anchor
        for (const missingSection of missing) {
            const contentString = content.toString('utf-8');

            // Find the anchor: the last present section that appears before this
            let anchorIndex = -1;
            for (let i = 0; i < expectedSections.length; i++) {
                const sek = expectedSections[i];
                if (sek === missingSection) {
                    break;
                }
                if (presentSections.has(sek)) {
                    const candidate = findInsertAfterSection(contentString, sek);
                    if (candidate !== -1 && candidate > anchorIndex) {
                        anchorIndex = candidate;
                    }
                }
            }

            const sectionContent = formatterAdapter.section(missingSection, Buffer.alloc(0));

            if (anchorIndex !== -1) {
                // Insert after anchorIndex, ensure there's a newline separation
                const before = contentString.substring(0, anchorIndex);
                const after = contentString.substring(anchorIndex);

                // If before doesn't end with a newline, add one
                const sep = /\n$/.test(before) ? '' : formatterAdapter.lineBreak();
                content = formatterAdapter.appendContent(
                    Buffer.from(before),
                    Buffer.from(sep),
                    formatterAdapter.lineBreak(),
                    sectionContent,
                    after.trim().length > 0 ? Buffer.from(after) : Buffer.alloc(0)
                );
            } else {
                // No suitable anchor, append at end with a preceding newline
                const sep = /\n$/.test(contentString) ? '' : formatterAdapter.lineBreak();

                content = formatterAdapter.appendContent(
                    content,
                    Buffer.from(sep),
                    formatterAdapter.lineBreak(),
                    sectionContent,
                );
            }

            // Mark inserted section as present so subsequent missing sections can
            // anchor after it if necessary.
            presentSections.add(missingSection);
        }

        return content;
    }
}
