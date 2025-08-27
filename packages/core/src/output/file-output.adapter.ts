import {
  createReadStream,
  existsSync,
  writeFile,
  writeFileSync,
} from 'node:fs';
import { OutputAdapter } from './output.adapter.js';
import { createInterface } from 'node:readline';
import { FormatterAdapter } from '../formatter/formatter.adapter.js';

export class FileOutputAdapter implements OutputAdapter {
  private static readonly fileLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly filePath: string,
    private readonly formatter: FormatterAdapter
  ) { }

  async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
    // Serialize access to the same file to prevent race conditions
    const existingLock = FileOutputAdapter.fileLocks.get(this.filePath);

    const operation = async () => {
      return this.performWriteSection(sectionIdentifier, data);
    };

    const lockPromise = existingLock
      ? existingLock.then(operation)
      : operation();
    FileOutputAdapter.fileLocks.set(this.filePath, lockPromise);

    try {
      await lockPromise;
    } finally {
      // Clean up the lock if this was the last operation
      if (FileOutputAdapter.fileLocks.get(this.filePath) === lockPromise) {
        FileOutputAdapter.fileLocks.delete(this.filePath);
      }
    }
  }

  private performWriteSection(
    sectionIdentifier: string,
    data: Buffer
  ): Promise<void> {
    // Look for the section in the file, replace content if it exists, or append if it doesn't.

    // Read file line by line to find the section
    return new Promise((resolve, reject) => {
      if (!existsSync(this.filePath)) {
        writeFileSync(this.filePath, '');
      }

      const fileStream = createReadStream(this.filePath);

      // Handle file read errors (like file not found)
      fileStream.on('error', (err) => {
        reject(err);
      });

      const readLine = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let sectionFound = false;
      let inSection = false;
      let output: Buffer = Buffer.alloc(0);

      const sectionStart = this.getSectionStart(sectionIdentifier);
      const sectionEnd = this.getSectionEnd(sectionIdentifier);

      const sectionContent = Buffer.concat([
        sectionStart,
        ...(data.length ? [data, this.formatter.lineBreak()] : []),
        sectionEnd,
      ]);

      const sectionStartString = sectionStart.toString();
      const sectionEndString = sectionEnd.toString();

      readLine.on('line', (line) => {
        const isSectionStart = line.trim() === sectionStartString.trim();
        if (isSectionStart) {
          sectionFound = true;
          inSection = true;
          output = Buffer.concat([output, sectionContent]);
          return;
        }

        const isSectionEnd = line.trim() === sectionEndString.trim();
        if (isSectionEnd && inSection) {
          inSection = false;
          // Skip the end marker as it's already included above
          return;
        }

        if (!inSection) {
          output = Buffer.concat([output, Buffer.from(line), this.formatter.lineBreak()]);
        }
        // Skip lines inside the section (they get replaced)
      });

      readLine.on('close', () => {
        if (!sectionFound) {
          output = Buffer.concat([output, sectionContent]);
        }
        writeFile(this.filePath, output, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  private getSectionStart(sectionIdentifier: string): Buffer {
    return this.formatter.comment(Buffer.from(`${sectionIdentifier}:start`));
  }

  private getSectionEnd(sectionIdentifier: string): Buffer {
    return this.formatter.comment(Buffer.from(`${sectionIdentifier}:end`));
  }
}
