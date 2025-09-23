import { StringDecoder } from 'node:string_decoder';
import { injectable, injectFromBase } from 'inversify';
import { SectionIdentifier, ReadableContent } from '@ci-dokumentor/core';
import type { FormatterAdapter } from '@ci-dokumentor/core';
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
    let remainingContent = ReadableContent.empty();

    const headerRegex = /^(##\s+(Inputs|Outputs|Secrets|Description))\s*$/i;

    type Section = { headerLine: ReadableContent; sectionKey: string; content: ReadableContent };
    let current: Section | null = null;
    let result = ReadableContent.empty();

    const flushCurrent = () => {
      if (!current) {
        return;
      }

      const sectionIdentifier = this.mapToStandardSection(current.sectionKey.toLowerCase());
      if (sectionIdentifier) {
        const contentPart = current.content.isEmpty()
          ? current.headerLine
          : current.headerLine.append(formatterAdapter.lineBreak(), current.content)


        const wrapped = formatterAdapter.section(sectionIdentifier, contentPart);
        result = result.append(wrapped);
      } else {
        // Unknown section: emit original header + content as-is
        result = result.append(
          current.headerLine,
          ...(
            current.content.isEmpty()
              ? []
              : [formatterAdapter.lineBreak(), current.content]
          )
        );
      }
      current = null;
    };

    const processLine = (line: ReadableContent) => {
      const match = line.trim().execRegExp(headerRegex);
      if (match) {
        // Found a header
        // Flush previous section
        flushCurrent();

        const header = match[1];
        const sectionName = match[2];
        current = {
          headerLine: new ReadableContent(header),
          sectionKey: sectionName,
          content: ReadableContent.empty()
        };
        return;
      }

      // Not a header
      if (current) {
        current.content = current.content.append(line, formatterAdapter.lineBreak());
      } else {
        // Outside any section, preserve original content
        result = result.append(line, formatterAdapter.lineBreak());
      }
    };

    while (offset < content.getSize()) {
      const end = Math.min(offset + chunkSize, content.getSize());
      const chunk = content.slice(offset, end);
      offset = end;
      remainingContent = remainingContent.append(decoder.write(chunk.toString()));

      let idx: number;
      while ((idx = remainingContent.search(formatterAdapter.lineBreak())) !== -1) {
        const line = remainingContent.slice(0, idx);
        processLine(line);
        remainingContent = remainingContent.slice(idx + 1);
      }
    }

    remainingContent = remainingContent.append(decoder.end());
    if (!remainingContent.isEmpty()) {
      processLine(remainingContent);
    }

    // Flush any final open section
    flushCurrent();

    return result;
  }
}