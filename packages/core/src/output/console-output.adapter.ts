import { OutputAdapter } from './output.adapter.js';

/**
 * Console output adapter that writes to stdout or stderr
 */
export class ConsoleOutputAdapter implements OutputAdapter {
  constructor(
    private readonly stream: 'stdout' | 'stderr' = 'stdout'
  ) {}

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    const output = this.stream === 'stdout' ? process.stdout : process.stderr;
    
    // Write section header
    output.write(`\n=== ${sectionIdentifier} ===\n`);
    
    // Write the data
    output.write(data);
    
    // Add trailing newline if data doesn't end with one
    if (data.length > 0 && data[data.length - 1] !== 0x0A) {
      output.write('\n');
    }
    
    // Write section footer
    output.write(`=== End ${sectionIdentifier} ===\n\n`);
  }
}