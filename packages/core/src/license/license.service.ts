import { injectable, inject } from 'inversify';
import type { ReaderAdapter, ReadableContent } from '../reader/reader.adapter.js';
import { FileReaderAdapter } from '../reader/file-reader.adapter.js';

export type LicenseInfo = {
  name: string;
  spdxId?: string;
  url?: string;
};

@injectable()
export class LicenseService {
  constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) { }

  /**
   * Detect license information from local license files
   */
  async detectLicenseFromFile(): Promise<LicenseInfo | undefined> {
    const possibleLicensePaths = [
      'LICENSE',
      'LICENSE.txt',
      'LICENSE.md',
      'license',
      'license.txt',
      'license.md',
      'COPYING',
      'COPYING.txt',
    ];

    for (const licensePath of possibleLicensePaths) {
      if (!this.readerAdapter.resourceExists(licensePath)) {
        continue;
      }

      const licenseContent = await this.readerAdapter.readResource(licensePath);

      // If file exists and has content
      if (licenseContent.length > 0) {
        // Try to detect license type from content
        const licenseName = this.detectLicenseType(licenseContent);

        return {
          name: licenseName,
          spdxId: this.getSpdxIdFromName(licenseName),
          url: undefined,
        };
      }
    }

    return undefined;
  }

  private detectLicenseType(content: ReadableContent): string {
    const upperContent = content.toString('utf-8').toUpperCase();

    if (
      upperContent.includes('MIT LICENSE') ||
      upperContent.includes('MIT LICENCE')
    ) {
      return 'MIT License';
    }
    if (
      upperContent.includes('APACHE LICENSE') &&
      upperContent.includes('VERSION 2.0')
    ) {
      return 'Apache License 2.0';
    }
    if (
      upperContent.includes('GNU GENERAL PUBLIC LICENSE') &&
      upperContent.includes('VERSION 3')
    ) {
      return 'GNU General Public License v3.0';
    }
    if (
      upperContent.includes('GNU GENERAL PUBLIC LICENSE') &&
      upperContent.includes('VERSION 2')
    ) {
      return 'GNU General Public License v2.0';
    }
    if (
      upperContent.includes('BSD 3-CLAUSE') ||
      (upperContent.includes('BSD') && upperContent.includes('3 CLAUSE'))
    ) {
      return 'BSD 3-Clause "New" or "Revised" License';
    }
    if (
      upperContent.includes('BSD 2-CLAUSE') ||
      (upperContent.includes('BSD') && upperContent.includes('2 CLAUSE'))
    ) {
      return 'BSD 2-Clause "Simplified" License';
    }
    if (upperContent.includes('ISC LICENSE')) {
      return 'ISC License';
    }

    return 'Custom License';
  }

  private getSpdxIdFromName(licenseName: string): string | undefined {
    const spdxMap: { [key: string]: string } = {
      'MIT License': 'MIT',
      'Apache License 2.0': 'Apache-2.0',
      'GNU General Public License v3.0': 'GPL-3.0',
      'GNU General Public License v2.0': 'GPL-2.0',
      'BSD 3-Clause "New" or "Revised" License': 'BSD-3-Clause',
      'BSD 2-Clause "Simplified" License': 'BSD-2-Clause',
      'ISC License': 'ISC',
    };

    return spdxMap[licenseName] || undefined;
  }
}
