import { OutputAdapter } from './output.adapter.js';
import { FormatterAdapter } from '../formatter/formatter.adapter.js';

export interface DryRunOutputResult {
  sections: { [sectionIdentifier: string]: Buffer };
  getFullContent(): Buffer;
}

export class DryRunOutputAdapter implements OutputAdapter {
  private readonly sections = new Map<string, Buffer>();

  constructor(
    private readonly formatter: FormatterAdapter
  ) { }

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    this.sections.set(sectionIdentifier, data);
  }

  getResult(): DryRunOutputResult {
    const sections: { [key: string]: Buffer } = {};
    
    for (const [identifier, content] of this.sections) {
      sections[identifier] = content;
    }

    return {
      sections,
      getFullContent: () => {
        let output = Buffer.alloc(0);
        
        for (const [sectionIdentifier, data] of this.sections) {
          const sectionStart = this.getSectionStart(sectionIdentifier);
          const sectionEnd = this.getSectionEnd(sectionIdentifier);
          
          const sectionContent = Buffer.concat([
            sectionStart,
            ...(data.length ? [data, this.formatter.lineBreak()] : []),
            sectionEnd,
            this.formatter.lineBreak()
          ]);
          
          output = Buffer.concat([output, sectionContent]);
        }
        
        return output;
      }
    };
  }

  private getSectionStart(sectionIdentifier: string): Buffer {
    return this.formatter.comment(Buffer.from(`${sectionIdentifier}:start`));
  }

  private getSectionEnd(sectionIdentifier: string): Buffer {
    return this.formatter.comment(Buffer.from(`${sectionIdentifier}:end`));
  }
}