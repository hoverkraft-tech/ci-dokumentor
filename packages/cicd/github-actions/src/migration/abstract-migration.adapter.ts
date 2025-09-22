import { injectable } from 'inversify';
import { StringDecoder } from 'string_decoder';
import { MigrationAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import type { FormatterAdapter, MigrateDocumentationPayload, ReaderAdapter, ReadableContent } from '@ci-dokumentor/core';
import { readFileSync, existsSync } from 'node:fs';

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

    supportsDestination(destination: string): boolean {
        if (!existsSync(destination)) {
            return false;
        }

        const content = readFileSync(destination);

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

    /**
     * Read existing content from a destination path using ReaderAdapter
     * Returns empty ReadableContent if destination doesn't exist or has no content
     */
    private readExistingContent(destination: string, readerAdapter: ReaderAdapter): ReadableContent {
        if (!existsSync(destination)) {
            return readerAdapter.emptyContent();
        }

        return readerAdapter.getContent(destination);
    }

    migrateDocumentation({ rendererAdapter, readerAdapter }: MigrateDocumentationPayload): void {
        const formatterAdapter = rendererAdapter.getFormatterAdapter();
        const destination = rendererAdapter.getDestination();

        // Use reader adapter to read existing content (maintaining abstraction)
        let content: ReadableContent = this.readExistingContent(destination, readerAdapter);

        // Check if content is empty by trying to read from the stream
        if (content.isEmpty()) {
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
        rendererAdapter.replaceContent(content);
    }

    protected abstract migrateContent(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent;

    /**
     * Generic helper that replaces tool-specific start/end markers inside a
     * ReadableContent stream with the standardized ci-dokumentor markers using the
     * configured patterns and section mappings.
     *
     * This implementation works directly with ReadableContent by processing the stream
     * as text without intermediate buffer conversions.
     */
    protected async processMarkerMappings(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
        // Convert the stream to string for text processing
        // This is necessary because regex operations require string/buffer access
        // Process line by line to perform marker replacements
        const lines = content.split(
            formatterAdapter.lineBreak()
        );

        const resultLines: string[] = [];

        const makeNonGlobal = (r?: RegExp) => r ? new RegExp(r.source, r.flags.replace(/g/g, '')) : undefined;
        const startPattern = makeNonGlobal(this.patterns.startMarkerPattern);
        const endPattern = makeNonGlobal(this.patterns.endMarkerPattern);
        const patternsIdentical = startPattern && endPattern && startPattern.source === endPattern.source && startPattern.flags === endPattern.flags;

        let seenToggle = false; // used when patterns are identical to alternate start/end

        for (const line of lines) {
            let processedLine = line;

            if (patternsIdentical && startPattern) {
                processedLine = processedLine.replace(startPattern, (match: string, sectionName: string) => {
                    const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                    if (!standardSection) {
                        return '';
                    }
                    // Alternate between start and end on successive matches
                    seenToggle = !seenToggle;
                    if (seenToggle) {
                        return formatterAdapter.sectionStart(standardSection).toString('utf-8');
                    }
                    return formatterAdapter.sectionEnd(standardSection).toString('utf-8');
                });
            } else {
                // Replace end then start to avoid nested replacement issues when patterns differ
                if (endPattern) {
                    processedLine = processedLine.replace(endPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return '';
                        }
                        return formatterAdapter.sectionEnd(standardSection).toString('utf-8');
                    });
                }

                if (startPattern) {
                    processedLine = processedLine.replace(startPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return '';
                        }
                        return formatterAdapter.sectionStart(standardSection).toString('utf-8');
                    });
                }
            }

            resultLines.push(processedLine);
        }

        return bufferToReadable(Buffer.from(resultLines.join('\n')));
    }

    /**
     * Map a tool-specific section name to the standard section identifier
     */
    private mapToStandardSection(sectionName: string): SectionIdentifier | undefined {
        const normalizedName = sectionName.toLowerCase().trim();
        return (this.sectionMappings as Record<string, SectionIdentifier>)[normalizedName] || undefined;
    }

    /**
     * Merge consecutive sections that map to the same target section
     */
    private mergeConsecutiveSections(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
        // Pattern to match section start and end markers
        const sectionPattern = /<!--\s*(\w+):start\s*-->\s*\n([\s\S]*?)<!--\s*\1:end\s*-->/g;

        // Find all sections and group consecutive ones by type
        const sections: Array<{ type: SectionIdentifier, content: string, start: number, end: number }> = [];
        let match;

        while ((match = content.match(sectionPattern)) !== null) {
            sections.push({
                type: match[1] as SectionIdentifier,
                content: match[2],
                start: (match.index || 0),
                end: (match.index || 0) + match[0].length
            });
        }

        // Group consecutive sections of the same type
        const mergedSections: Array<{ type: SectionIdentifier, contents: string[], start: number, end: number }> = [];
        let currentGroup: { type: SectionIdentifier, contents: string[], start: number, end: number } | null = null;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            if (currentGroup && currentGroup.type === section.type) {
                // Check if sections are consecutive (only whitespace between them)
                const betweenContent = content.extract(currentGroup.end, section.start).trim();
                if (betweenContent.isEmpty()) {
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

                content = content
                    .extract(0, group.start)
                    .append(
                        replacement.trim(),
                        content.extract(group.end)
                    );
            }
        });

        return content;
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

        while ((match = content.match(sectionPattern)) !== null) {
            presentSections.add(match[1]);
        }

        // Build list of missing sections in the canonical order
        const missing = expectedSections.filter(s => !presentSections.has(s));

        if (missing.length === 0) {
            return content;
        }

        // Add missing sections at the end
        for (const missingSection of missing) {
            const sectionStart = formatterAdapter.sectionStart(missingSection);
            const sectionEnd = formatterAdapter.sectionEnd(missingSection);

            // Ensure we have a newline before adding the section
            if (!content.endsWith(formatterAdapter.lineBreak())) {
                content.append(formatterAdapter.lineBreak());
            }

            content.append(
                formatterAdapter.lineBreak(),
                sectionStart,
                formatterAdapter.lineBreak(),
                sectionEnd,
                formatterAdapter.lineBreak()
            );
        }

        return content;
    }
}
