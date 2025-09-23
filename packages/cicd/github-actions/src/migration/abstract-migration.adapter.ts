import { StringDecoder } from 'node:string_decoder';
import { injectable, inject } from 'inversify';
import { MigrationAdapter, SectionIdentifier, FileReaderAdapter, ReadableContent } from '@ci-dokumentor/core';
import type { FormatterAdapter, MigrateDocumentationPayload, ReaderAdapter } from '@ci-dokumentor/core';

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

        return content.test(this.patterns.detectionPattern);
    }

    async migrateDocumentation({ rendererAdapter }: MigrateDocumentationPayload): Promise<void> {
        const formatterAdapter = rendererAdapter.getFormatterAdapter();

        let content = await this.readerAdapter.readResource(rendererAdapter.getDestination());

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

        let remainingContent = ReadableContent.empty();
        let offset = 0;
        let markerMappingsContent = ReadableContent.empty();

        let seenToggle = false; // used when patterns are identical to alternate start/end
        const processLine = (line: ReadableContent, addNewline: boolean) => {
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
                        return formatterAdapter.sectionStart(standardSection).append(formatterAdapter.lineBreak()).toString();
                    }
                    return formatterAdapter.lineBreak().append(formatterAdapter.sectionEnd(standardSection), formatterAdapter.lineBreak()).toString();
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
                        return formatterAdapter.lineBreak().append(formatterAdapter.sectionEnd(standardSection), formatterAdapter.lineBreak()).toString();
                    });
                }

                if (startPattern) {
                    out = out.replace(startPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return '';
                        }
                        return formatterAdapter.sectionStart(standardSection).append(formatterAdapter.lineBreak()).toString();
                    });
                }
            }

            markerMappingsContent = markerMappingsContent.append(out);

            if (addNewline) {
                markerMappingsContent = markerMappingsContent.append(formatterAdapter.lineBreak());
            }
        };

        while (offset < content.getSize()) {
            const end = Math.min(offset + chunkSize, content.getSize());
            const chunk = content.slice(offset, end);
            offset = end;
            remainingContent = remainingContent.append(decoder.write(chunk.toString()));

            let idx;
            while ((idx = remainingContent.search(formatterAdapter.lineBreak())) !== -1) {
                const line = remainingContent.slice(0, idx);
                processLine(line, true);
                remainingContent = remainingContent.slice(idx + 1);
            }
        }

        remainingContent = remainingContent.append(decoder.end());
        if (!remainingContent.isEmpty()) {
            // Last line without a trailing newline
            processLine(remainingContent, false);
        }

        return markerMappingsContent;
    }

    protected mapToStandardSection(sectionName: string) {
        const normalizedName = sectionName.toLowerCase().trim();
        return (this.sectionMappings as Record<string, SectionIdentifier>)[normalizedName] || null;
    }

    /**
     * Merge consecutive sections that map to the same target section
     */
    private mergeConsecutiveSections(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {
        let result = content;

        // Pattern to match section start and end markers
        const sectionPattern = /<!--\s*(\w+):start\s*-->\s*\n([\s\S]*?)<!--\s*\1:end\s*-->/g;

        // Find all sections and group consecutive ones by type
        const sections: Array<{ type: SectionIdentifier, content: ReadableContent, start: number, end: number }> = [];
        let match;

        while ((match = result.execRegExp(sectionPattern)) !== null) {
            sections.push({
                type: match[1] as SectionIdentifier,
                content: new ReadableContent(match[2]),
                start: match.index || 0,
                end: (match.index || 0) + match[0].length
            });
        }

        // Group consecutive sections of the same type
        const mergedSections: Array<{ type: SectionIdentifier, content: ReadableContent, start: number, end: number }> = [];
        let currentGroup: { type: SectionIdentifier, content: ReadableContent, start: number, end: number } | null = null;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            if (currentGroup && currentGroup.type === section.type) {
                // Check if sections are consecutive (only whitespace between them)
                const betweenContent = result.slice(currentGroup.end, section.start).trim();
                if (betweenContent.isEmpty()) {
                    // Merge this section with the current group
                    currentGroup.content = currentGroup.content.append(section.content);
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
                content: section.content,
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
            if (!group.content.isEmpty()) {
                // Merge the contents
                const mergedContent = group.content.replace(/^\s*\n|\n\s*$/g, '').trim();
                const replacement = formatterAdapter.section(
                    group.type,
                    new ReadableContent(mergedContent)
                );

                result = result.slice(0, group.start).append(replacement.trim(), result.slice(group.end));
            }
        });

        return new ReadableContent(result);
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
        while ((match = content.execRegExp(sectionPattern)) !== null) {
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
        const findInsertAfterSection = (content: ReadableContent, sectionName: SectionIdentifier): number => {
            const endMarker = formatterAdapter.sectionEnd(sectionName);
            const idx = content.searchLast(endMarker);
            if (idx !== -1) {
                return idx + endMarker.getSize();
            }

            // If there's a start marker but no end (malformed), insert after start
            const startMarker = formatterAdapter.sectionStart(sectionName);
            const sidx = content.searchLast(startMarker);
            if (sidx !== -1) {
                return sidx + startMarker.getSize();
            }

            return -1;
        };

        // Iterate expectedSections order and for each missing section decide anchor
        for (const missingSection of missing) {
            // Find the anchor: the last present section that appears before this
            let anchorIndex = -1;
            for (let i = 0; i < expectedSections.length; i++) {
                const sek = expectedSections[i];
                if (sek === missingSection) {
                    break;
                }
                if (presentSections.has(sek)) {
                    const candidate = findInsertAfterSection(content, sek);
                    if (candidate !== -1 && candidate > anchorIndex) {
                        anchorIndex = candidate;
                    }
                }
            }

            const sectionContent = formatterAdapter.section(missingSection, ReadableContent.empty());

            if (anchorIndex !== -1) {
                // Insert after anchorIndex, ensure there's a newline separation
                const before = content.slice(0, anchorIndex);
                const after = content.slice(anchorIndex);

                // If before doesn't end with a newline, add one
                const separator = before.test(/\n$/) ? ReadableContent.empty() : formatterAdapter.lineBreak();
                content = before.append(
                    separator,
                    formatterAdapter.lineBreak(),
                    sectionContent,
                    after.trim().isEmpty() ? ReadableContent.empty() : after
                );
            } else {
                // No suitable anchor, append at end with a preceding newline
                const separator = content.test(/\n$/) ? ReadableContent.empty() : formatterAdapter.lineBreak();

                content = content.append(
                    separator,
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
