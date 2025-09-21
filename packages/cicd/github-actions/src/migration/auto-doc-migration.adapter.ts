import { injectable, injectFromBase } from 'inversify';
import { StringDecoder } from 'string_decoder';
import { SectionIdentifier } from '@ci-dokumentor/core';
import type { FormatterAdapter, ReadableContent } from '@ci-dokumentor/core';
import { AbstractMigrationAdapter } from './abstract-migration.adapter.js';

/**
 * Migration adapter for auto-doc tool
 * Transforms markers like:
 * ## Inputs -> <!-- inputs:start -->\n## Inputs\n<!-- inputs:end -->
 * ## Outputs -> <!-- outputs:start -->\n## Outputs\n<!-- outputs:end -->
 * ## Secrets -> <!-- secrets:start -->\n## Secrets\n<!-- secrets:end -->
 * ## Description -> <!-- overview:start -->\n## Description\n<!-- overview:end -->
 */
@injectable()
@injectFromBase({
  extendConstructorArguments: true,
})
export class AutoDocMigrationAdapter extends AbstractMigrationAdapter {
  protected readonly name = 'auto-doc';

  protected readonly sectionMappings: Record<string, SectionIdentifier> = {
    'inputs': SectionIdentifier.Inputs,
    'outputs': SectionIdentifier.Outputs,
    'secrets': SectionIdentifier.Secrets,
    'description': SectionIdentifier.Overview,
  };

  protected readonly patterns = {
    startMarkerPattern: /^(##\s+(Inputs|Outputs|Secrets|Description))\s*$/gm,
    detectionPattern: /^##\s+(Inputs|Outputs|Secrets|Description)\s*$/m,
  };

  protected migrateContent(content: ReadableContent, formatterAdapter: FormatterAdapter): ReadableContent {

    const decoder = new StringDecoder('utf8');
    const chunkSize = 8 * 1024;

    // We'll stream through the input buffer, emit lines, and process headers as
    // they appear. This avoids building one giant string for the whole fragment.
    let offset = 0;
    let rem = '';

    const headerRegex = /^(##\s+(Inputs|Outputs|Secrets|Description))\s*$/i;

    type Section = { headerLine: string; sectionKey: string; parts: ReadableContent[] };
    let current: Section | null = null;
    const outputParts: ReadableContent[] = [];

    const flushCurrent = () => {
      if (!current) return;
      const sectionIdentifier = this.mapToStandardSection(current.sectionKey.toLowerCase());
      if (sectionIdentifier) {
        const contentPart = current.parts.length
          ? formatterAdapter.appendContent(Buffer.from(current.headerLine), formatterAdapter.lineBreak(), ...current.parts)
          : Buffer.from(current.headerLine, 'utf-8');
        const wrapped = formatterAdapter.section(sectionIdentifier, contentPart);
        outputParts.push(wrapped);
      } else {
        // Unknown section: emit original header + content as-is
        outputParts.push(Buffer.from(current.headerLine, 'utf-8'), formatterAdapter.lineBreak());
        if (current.parts.length) outputParts.push(formatterAdapter.appendContent(...current.parts));
      }
      current = null;
    };

    const processLine = (line: string) => {
      const m = headerRegex.exec(line.trim());
      if (m) {
        // Found a header
        // Flush previous section
        flushCurrent();

        const header = m[1];
        const sectionName = m[2];
        current = { headerLine: header, sectionKey: sectionName, parts: [] };
        return;
      }

      // Not a header
      if (current) {
        current.parts.push(Buffer.from(line, 'utf-8'), formatterAdapter.lineBreak());
      } else {
        // Outside any section, preserve original content
        outputParts.push(Buffer.from(line, 'utf-8'), formatterAdapter.lineBreak());
      }
    };

    while (offset < content.length) {
      const end = Math.min(offset + chunkSize, content.length);
      const chunk = content.subarray(offset, end);
      offset = end;
      rem += decoder.write(chunk);

      let idx: number;
      while ((idx = rem.indexOf('\n')) !== -1) {
        const line = rem.slice(0, idx);
        processLine(line);
        rem = rem.slice(idx + 1);
      }
    }

    rem += decoder.end();
    if (rem.length) processLine(rem);

    // Flush any final open section
    flushCurrent();

    return formatterAdapter.appendContent(...outputParts);
  }
}