import { writeFile } from 'node:fs/promises';
import { OutputAdapter } from './output.adapter.js';

export interface JsonOutput {
  sections: Record<string, string>;
  metadata: {
    timestamp: string;
    format: string;
  };
}

/**
 * JSON output adapter that writes structured JSON data
 */
export class JsonOutputAdapter implements OutputAdapter {
  private sections: Record<string, string> = {};
  private pendingWrites: Promise<void> = Promise.resolve();

  constructor(
    private readonly destination: string, // File path or 'stdout'/'stderr'
  ) {}

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    // Store the section data
    this.sections[sectionIdentifier] = data.toString('utf-8');
    
    // Chain the write operation to avoid race conditions
    this.pendingWrites = this.pendingWrites.then(() => this.writeJsonOutput());
    await this.pendingWrites;
  }

  private async writeJsonOutput(): Promise<void> {
    const jsonOutput: JsonOutput = {
      sections: this.sections,
      metadata: {
        timestamp: new Date().toISOString(),
        format: 'json'
      }
    };

    const jsonString = JSON.stringify(jsonOutput, null, 2);

    if (this.destination === 'stdout') {
      process.stdout.write(jsonString + '\n');
    } else if (this.destination === 'stderr') {
      process.stderr.write(jsonString + '\n');
    } else {
      // Write to file
      await writeFile(this.destination, jsonString, 'utf-8');
    }
  }
}