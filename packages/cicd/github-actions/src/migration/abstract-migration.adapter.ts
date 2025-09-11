import { injectable } from 'inversify';
import { StringDecoder } from 'string_decoder';
import { MigrationAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import type { FormatterAdapter, MigrateDocumentationPayload } from '@ci-dokumentor/core';
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

    async migrateDocumentation({ rendererAdapter }: MigrateDocumentationPayload): Promise<void> {
        const formatterAdapter = rendererAdapter.getFormatterAdapter();

        // Use renderer adapter to read existing content (maintaining abstraction)
        const input: Buffer = await rendererAdapter.readExistingContent();

        if (input.length === 0) {
            // No existing content to migrate
            return;
        }

        // Migrate the entire content using the adapter's migrateContent method
        // which can either process markers or wrap sections depending on the adapter
        const output = this.migrateContent(input, formatterAdapter);

        // Replace the entire content through the renderer adapter
        await rendererAdapter.replaceContent(output);
    }



    protected abstract migrateContent(input: Buffer, formatterAdapter: FormatterAdapter): Buffer;

    protected getStartMarker(section: SectionIdentifier, formatterAdapter: FormatterAdapter): Buffer {
        const marker = formatterAdapter.comment(Buffer.from(`${section}:start`));
        return marker;
    }

    protected getEndMarker(section: SectionIdentifier, formatterAdapter: FormatterAdapter): Buffer {
        const marker = formatterAdapter.comment(Buffer.from(`${section}:end`));
        return marker;
    }

    protected wrapWithMarkers(section: SectionIdentifier, input: Buffer, formatterAdapter: FormatterAdapter): Buffer {
        const startMarker = this.getStartMarker(section, formatterAdapter);
        const endMarker = this.getEndMarker(section, formatterAdapter);

        if (!input.length) {
            return startMarker;
        }

        return formatterAdapter.appendContent(startMarker, input, endMarker);
    }

    /**
     * Generic helper that replaces tool-specific start/end markers inside a
     * Buffer fragment with the standardized ci-dokumentor markers using the
     * configured patterns and section mappings.
     *
     * Adapters can call this to avoid duplicating Buffer->string conversion
     * and the replace logic. The helper operates on the provided fragment
     * only (which is produced by the scanner) so it won't allocate the full
     * destination file as a single string.
     */
    protected processMarkerMappings(input: Buffer, formatterAdapter: FormatterAdapter): Buffer {
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
        const parts: Buffer[] = [];

        let seenToggle = false; // used when patterns are identical to alternate start/end
        const processLine = (line: string, addNewline: boolean) => {
            let out = line;
            if (patternsIdentical && startPattern) {
                out = out.replace(startPattern, (match: string, sectionName: string) => {
                    const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                    if (!standardSection) {
                        return match;
                    }
                    // Alternate between start and end on successive matches
                    seenToggle = !seenToggle;
                    if (seenToggle) {
                        return this.getStartMarker(standardSection, formatterAdapter).toString('utf-8');
                    }
                    return this.getEndMarker(standardSection, formatterAdapter).toString('utf-8');
                });
            } else {
                // Replace end then start to avoid nested replacement issues when
                // patterns differ.
                if (endPattern) {
                    out = out.replace(endPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return match;
                        }
                        // formatterAdapter is required by contract
                        return this.getEndMarker(standardSection, formatterAdapter).toString('utf-8');
                    });
                }

                if (startPattern) {
                    out = out.replace(startPattern, (match: string, sectionName: string) => {
                        const standardSection = this.mapToStandardSection(sectionName.toLowerCase());
                        if (!standardSection) {
                            return match;
                        }
                        // formatterAdapter is required by contract
                        return this.getStartMarker(standardSection, formatterAdapter).toString('utf-8');
                    });
                }
            }

            if (addNewline) {
                parts.push(Buffer.from(out + '\n', 'utf-8'));
            } else {
                parts.push(Buffer.from(out, 'utf-8'));
            }
        };

        while (offset < input.length) {
            const end = Math.min(offset + chunkSize, input.length);
            const chunk = input.subarray(offset, end);
            offset = end;
            rem += decoder.write(chunk);

            let idx;
            while ((idx = rem.indexOf('\n')) !== -1) {
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

        return Buffer.concat(parts);
    }

    protected mapToStandardSection(sectionName: string) {
        const normalizedName = sectionName.toLowerCase().trim();
        return (this.sectionMappings as Record<string, SectionIdentifier>)[normalizedName] || null;
    }
}
