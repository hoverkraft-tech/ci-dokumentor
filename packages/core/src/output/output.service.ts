import { injectable } from 'inversify';
import { OutputAdapter } from './output.adapter.js';

export interface OutputFormat {
  type: 'text' | 'json' | 'github-action';
  destination?: string; // File path or 'stdout'/'stderr' for console output
}

export interface OutputConfiguration {
  formats: OutputFormat[];
  defaultOutput?: string; // Used when format doesn't specify destination
}

/**
 * Service for managing multiple output formats and destinations
 * Coordinates writing content to different output adapters
 */
@injectable()
export class OutputService {
  private outputAdapters: Map<string, OutputAdapter> = new Map();

  /**
   * Register an output adapter for a specific identifier
   */
  registerAdapter(identifier: string, adapter: OutputAdapter): void {
    this.outputAdapters.set(identifier, adapter);
  }

  /**
   * Write a section to all registered output adapters
   */
  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    const writePromises: Promise<void>[] = [];
    
    for (const adapter of this.outputAdapters.values()) {
      writePromises.push(adapter.writeSection(sectionIdentifier, data));
    }

    await Promise.all(writePromises);
  }

  /**
   * Get all registered adapter identifiers
   */
  getAdapterIdentifiers(): string[] {
    return Array.from(this.outputAdapters.keys());
  }

  /**
   * Clear all registered adapters
   */
  clearAdapters(): void {
    this.outputAdapters.clear();
  }
}